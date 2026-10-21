// The verifier eval (`verify` mode): the plugin's real verifier, dispatched on a workspace whose product has a
// planted defect that the in-process tests cannot see, and on a clean copy. It measures what the pipeline modes
// cannot: whether the verifier catches a defect only a running product shows (detection), and whether it reports
// failures that are not there (noise). No pipeline runs; the feature is the reference implementation.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ModelUsage } from '@anthropic-ai/claude-agent-sdk';
import { ROOT, SCENARIO_DIR, VERIFY_EVAL_RUNS, VERIFY_EVAL_VERSION } from './config.ts';
import { exec, execOrThrow } from './exec.ts';
import type { RoleProfile } from './model-profile.ts';
import type { Oracle } from './oracle.ts';
import { sumTokens, usageLimitError, type ModeResult } from './results.ts';
import { runSession } from './session.ts';
import { countOpen, parseVerifierProbes, parseVerifierResults, verifierReports } from './verifier.ts';
import { atLeast } from './versions.ts';
import { createWorkspace } from './workspace.ts';

export const VERIFY_DIR = join(SCENARIO_DIR, 'verify');
const FEATURE_PATH = join('specs', '001-pause-listing');
/** From this version the verifier probes the requirements (`probes:`, `open:`) and its dispatch carries `BASE_TREE`. */
export const PROBES_FROM = '0.20.0';

export interface VerifyCase {
  name: string;
  /** Directory under `scenario/verify/` copied over the workspace after the reference; null for the clean copy. */
  overlay: string | null;
  /**
   * Scenario ids the defect can break: in some order of requests the scenario allows, its expected outcome, or a
   * precondition it states, is false or cannot be observed on the running server. A `fail` on any of them is a catch;
   * a `fail` on none of them is noise.
   */
  expectFail: string[];
  /**
   * Requirement ids (`FR-006`) whose rule the defect breaks where no scenario looks: a probe `fail` whose `source:`
   * names one of them is a catch. Only a verifier that probes the requirements (uroboros 0.20.0+) can make it.
   */
  expectProbe?: string[];
}

/** The case plants a defect: some scenario or requirement it breaks is named. */
export const hasDefect = (c: VerifyCase): boolean => c.expectFail.length > 0 || (c.expectProbe?.length ?? 0) > 0;

export interface VerifyRun {
  reported: boolean;
  /** Defect cases only: a `fail` on an expected id. */
  caught?: boolean;
  strayFails: number;
  notRun: number;
  /** Probes reported `fail` (0.20.0+); on the clean copy each one is also a stray failure. */
  probeFails?: number;
  /** Behaviors left `open:` (0.20.0+): outcomes the spec does not fix, for the user to decide. */
  open?: number;
  /** `git status --porcelain` was not empty after the session. */
  touched: boolean;
  costUsd: number;
  durationMs: number;
  error?: string;
}

export interface VerifierEval {
  version: number;
  cases: Array<{ name: string; expectFail: boolean; runs: VerifyRun[] }>;
}

export function readCases(): VerifyCase[] {
  return JSON.parse(readFileSync(join(VERIFY_DIR, 'cases.json'), 'utf8')) as VerifyCase[];
}

/** Lays the case's product over a fixture copy: the reference implementation, the defect, and the fixed feature artifacts. */
export function buildCase(workspace: string, c: VerifyCase): void {
  cpSync(join(ROOT, 'harness', 'reference', 'src'), join(workspace, 'src'), { recursive: true });
  if (c.overlay) cpSync(join(VERIFY_DIR, c.overlay), workspace, { recursive: true });
  cpSync(join(VERIFY_DIR, 'feature'), join(workspace, FEATURE_PATH), { recursive: true });
}

/** A fresh workspace with the case committed on top of the fixture, so a clean status afterwards means nothing was touched. */
async function prepareWorkspace(c: VerifyCase): Promise<string> {
  const workspace = await createWorkspace('verify');
  buildCase(workspace, c);
  await execOrThrow('git', ['add', '-A'], workspace);
  await execOrThrow('git', ['commit', '--quiet', '-m', 'feature'], workspace);
  return workspace;
}

export function verifierAvailable(pluginDir: string): boolean {
  const agents = join(pluginDir, 'agents');
  return existsSync(agents) && readdirSync(agents).some((f) => f.startsWith('uroboros-verifier-'));
}

/** The DECISION LOG lines of the fixed state file, so the prompt and the file say the same. */
function decisionLog(): string {
  const state = readFileSync(join(VERIFY_DIR, 'feature', 'loop-state.md'), 'utf8');
  return state.split(/\r?\n/).filter((line) => /^- D\d+ /.test(line)).join('\n');
}

/** The orchestrator's V1 prompt (verify protocol), handed to the main thread to dispatch verbatim. */
export function promptFor(workspace: string, pluginDir: string, profile: RoleProfile, changedFiles: string, version: string, baseTree: string): string {
  const feature = join(workspace, FEATURE_PATH);
  const dispatch = [
    `INSTRUCTIONS: ${join(pluginDir, 'references', 'verifier-instructions.md')}`,
    'MODE: sdd',
    'ROUND: 1',
    `SCENARIOS_FROM: ${join(feature, 'spec.md')}, ${join(feature, 'quickstart.md')}`,
    `CHANGED_FILES: ${changedFiles.split(/\r?\n/).filter(Boolean).join(', ')}`,
    ...(atLeast(version, PROBES_FROM) ? [`BASE_TREE: ${baseTree}`] : []),
    'RUN_COMMANDS: none',
    `STATE_FILE: ${join(feature, 'loop-state.md')}`,
    'DECISION LOG:',
    decisionLog(),
  ].join('\n');
  return [
    `Use the Agent tool once: subagent_type \`uroboros:uroboros-verifier-${profile.effort}\`, model \`${profile.alias}\`, and as its prompt exactly the text between the markers. Wait for its report, then reply with the report verbatim and nothing else. Do not run, read or change anything yourself.`,
    '<<<',
    dispatch,
    '>>>',
  ].join('\n');
}

/**
 * A catch is a `fail` on a scenario the defect breaks, or a probe `fail` naming a requirement it breaks. A scenario
 * `fail` elsewhere is a stray failure; so is every probe `fail` on the clean copy. A probe `fail` on a defect case
 * that names another requirement is counted but not judged: the defect may well break that rule too.
 */
export function scoreRun(report: string | undefined, c: VerifyCase): Pick<VerifyRun, 'reported' | 'caught' | 'strayFails' | 'notRun' | 'probeFails' | 'open'> {
  if (!report) return { reported: false, strayFails: 0, notRun: 0 };
  const results = parseVerifierResults(report);
  const probes = parseVerifierProbes(report);
  const expected = new Set(c.expectFail);
  const fails = results.filter((r) => r.outcome === 'fail');
  const probeFails = probes.filter((p) => p.outcome === 'fail');
  const hitsExpected = (ids: string[]) => ids.some((id) => expected.has(id));
  const namesExpected = (source: string) => (c.expectProbe ?? []).some((fr) => new RegExp(`\\b${fr}\\b`).test(source));
  return {
    reported: true,
    caught: hasDefect(c) ? fails.some((r) => hitsExpected(r.ids)) || probeFails.some((p) => namesExpected(p.source)) : undefined,
    strayFails: fails.filter((r) => !hitsExpected(r.ids)).length + (hasDefect(c) ? 0 : probeFails.length),
    notRun: results.filter((r) => r.outcome === 'not-run').length,
    probeFails: probeFails.length,
    open: countOpen(report),
  };
}

interface VerifyModeRequest {
  runDir: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  oracle: Oracle;
}

/** Runs every case `VERIFY_EVAL_RUNS` times, sequentially, and scores the mode. */
export async function runVerifyMode(req: VerifyModeRequest): Promise<ModeResult> {
  const startedAt = new Date().toISOString();
  const base = { mode: 'verify' as const, startedAt, harnessCostUsd: 0, questionsAsked: 0 };
  if (!verifierAvailable(req.pluginDir)) {
    return { ...base, durationMs: 0, costUsd: 0, tokens: sumTokens({}), models: [], e2e: { pass: true, checks: {} }, notApplicable: 'this uroboros version ships no verifier agent' };
  }

  const askedBefore = req.oracle.asked;
  const oracleCostBefore = req.oracle.costUsd;
  const usage: Record<string, ModelUsage>[] = [];
  const failures: string[] = [];
  const evaluation: VerifierEval = { version: VERIFY_EVAL_VERSION, cases: [] };
  let costUsd = 0;
  let durationMs = 0;
  let aborted: string | undefined;

  for (const c of readCases()) {
    const entry = { name: c.name, expectFail: hasDefect(c), runs: [] as VerifyRun[] };
    evaluation.cases.push(entry);
    for (let i = 1; i <= VERIFY_EVAL_RUNS && !aborted; i++) {
      const workspace = await prepareWorkspace(c);
      const dir = join(req.runDir, 'verify', `${c.name}-${i}`);
      mkdirSync(dir, { recursive: true });
      console.log(`[verify] ${c.name} ${i}/${VERIFY_EVAL_RUNS} in ${workspace}`);
      const changed = (await execOrThrow('git', ['diff', '--name-only', 'HEAD~1', 'HEAD'], workspace)).trim();
      // The fixture commit: the product before the feature, as the plugin's `BASE TREE` would record it.
      const baseTree = (await execOrThrow('git', ['rev-parse', 'HEAD~1^{tree}'], workspace)).trim();
      const transcriptPath = join(dir, 'transcript.jsonl');
      const session = await runSession({
        mode: 'verify',
        cwd: workspace,
        prompt: promptFor(workspace, req.pluginDir, req.profile, changed, req.version, baseTree),
        pluginDir: req.pluginDir,
        profile: req.profile,
        oracle: req.oracle,
        transcriptPath,
      });
      costUsd += session.costUsd;
      durationMs += session.durationMs;
      usage.push(session.modelUsage);
      aborted = usageLimitError(session.error);
      if (aborted) break;
      const reports = verifierReports(transcriptPath);
      const status = await exec('git', ['status', '--porcelain'], workspace);
      entry.runs.push({
        ...scoreRun(reports[reports.length - 1], c),
        touched: status.output.trim() !== '',
        costUsd: session.costUsd,
        durationMs: session.durationMs,
        error: session.error,
      });
      if (session.error) failures.push(`${c.name}-${i}: ${session.error}`);
    }
    if (aborted) break;
  }

  const runs = evaluation.cases.flatMap((c) => c.runs);
  const merged: Record<string, ModelUsage> = {};
  usage.forEach((u, i) => Object.entries(u).forEach(([model, mu]) => (merged[`${model}#${i}`] = mu)));
  const checks = {
    'every run returned a report': runs.length > 0 && runs.every((r) => r.reported),
    'no run changed the repo': runs.every((r) => !r.touched),
    'no session error': runs.every((r) => !r.error),
  };
  return {
    ...base,
    durationMs,
    costUsd,
    harnessCostUsd: req.oracle.costUsd - oracleCostBefore,
    questionsAsked: req.oracle.asked - askedBefore,
    tokens: sumTokens(merged),
    models: [...new Set(usage.flatMap((u) => Object.keys(u)))],
    e2e: { pass: Object.values(checks).every(Boolean), checks },
    verifierEval: evaluation,
    error: failures.length ? failures.join(' | ') : undefined,
    aborted,
  };
}
