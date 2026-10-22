// The reviewer eval (`review` mode): the plugin's real reviewer, dispatched with the orchestrator's implement step-B
// prompt on a change that carries one planted defect and still passes the gate, and on a clean copy. It measures what
// the pipeline modes cannot: whether the reviewer's report names a defect the gate does not catch (detection), and
// what it reports on a clean change. No pipeline runs; the change is the reference implementation plus its tests.
// The prompt follows the step-B protocol of the uroboros version measured (`stepBPrompt`). The reviewer's report is
// scored as it arrives — before the refuter, which only a full pipeline runs.
import { createHash } from 'node:crypto';
import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ModelUsage } from '@anthropic-ai/claude-agent-sdk';
import { JUDGE_MODEL, REVIEW_EVAL_RUNS, REVIEW_EVAL_VERSION, ROOT, SCENARIO_DIR } from './config.ts';
import { exec, execOrThrow } from './exec.ts';
import type { RoleProfile } from './model-profile.ts';
import type { Oracle } from './oracle.ts';
import { sumTokens, usageLimitError, type ModeResult } from './results.ts';
import { runSession } from './session.ts';
import { snapshot, writeRunDiff } from './snapshot.ts';
import { askStructured } from './structured.ts';
import { subagentReports } from './transcript.ts';
import { runGate, type GateResult } from './verify.ts';
import { atLeast } from './versions.ts';
import { createWorkspace } from './workspace.ts';

export const REVIEW_DIR = join(SCENARIO_DIR, 'review');
const FEATURE_PATH = join('specs', '001-pause-listing');
/** The first uroboros version whose step-B prompt this eval reproduces (ROUND, FOLDS, STANDING_DECISIONS, model guides). */
export const FIRST_VERSION = '0.16.0';
/** The first version whose step-B protocol this eval does not reproduce yet: extend `stepBPrompt` before measuring it. */
export const UNKNOWN_FROM = '0.23.0';
/** From this version step B passes the run's diff between working-tree snapshots (`BASE TREE`, `ROUND TREE`, `RUN_DIFF`). */
export const SNAPSHOTS_FROM = '0.17.0';
/** From this version the state file carries the intake's `SURFACES` and the implementer's `### Shared code touched`. */
export const SURFACES_FROM = '0.18.0';
/** From this version the state file carries the implementer's `### Red first` lines. */
export const RED_FIRST_FROM = '0.19.0';
const RED_FIRST = '\n### Red first\n\n- round 1: not captured — the tests in test/pause.test.ts were written after the code\n';
/** The surfaces the fixed feature's intake would have recorded: every one of them is in scope. */
const SURFACES = 'SURFACES: HTTP API only — POST /listings/:id/pause and /resume (in scope); GET /listings search (in scope: paused listings hidden); GET /listings/:id (in scope: shows the status); POST /listings/:id/orders (in scope: refused while paused); the published route table in src/gateway.ts (in scope). No UI, CLI or background jobs.';

/** The snapshots of a run from 0.17.0: the tree before the change, the tree after it, and the written run diff. */
export interface RunTrees {
  base: string;
  round: string;
  runDiff: string;
}

export interface ReviewCase {
  name: string;
  /** Directory under `scenario/review/` copied over the implementation; null for the clean copy. */
  overlay: string | null;
  /** The planted defect in plain words, for the judge; null for the clean copy. */
  defect: string | null;
}

export interface ReviewRun {
  reported: boolean;
  status?: string;
  findings: number;
  risks: number;
  /** Defect cases only: the judge found a finding or risk that names the planted defect. */
  caught?: boolean;
  judgeEvidence?: string;
  /** The case's gate (test, typecheck, lint) was green, as every case requires. */
  gateGreen: boolean;
  /** The working tree differed after the session. */
  touched: boolean;
  costUsd: number;
  durationMs: number;
  error?: string;
}

export interface ReviewerEval {
  version: number;
  cases: Array<{ name: string; planted: boolean; runs: ReviewRun[] }>;
}

export function readReviewCases(): ReviewCase[] {
  return JSON.parse(readFileSync(join(REVIEW_DIR, 'cases.json'), 'utf8')) as ReviewCase[];
}

/** The fixed feature artifacts: spec, plan, tasks and the state file after implement's first round. */
export function copyFeature(workspace: string): void {
  cpSync(join(REVIEW_DIR, 'feature'), join(workspace, FEATURE_PATH), { recursive: true });
}

/** Lays the change over a fixture copy: the reference implementation, its tests, then the case's defect. */
export function buildReviewCase(workspace: string, c: ReviewCase): void {
  cpSync(join(ROOT, 'harness', 'reference', 'src'), join(workspace, 'src'), { recursive: true });
  cpSync(join(REVIEW_DIR, 'implementation'), workspace, { recursive: true });
  if (c.overlay) cpSync(join(REVIEW_DIR, c.overlay), workspace, { recursive: true });
}

/**
 * The fixture and the feature artifacts committed, the change left uncommitted: the tree a reviewer sees after implement's
 * first round. From 0.17.0 the orchestrator also took `BASE TREE` before the change and `ROUND TREE 1` after it, wrote the run
 * diff, and recorded both trees, the green gate baseline and the implementer's (empty) `gate_touched` in the state file.
 */
export async function prepareWorkspace(c: ReviewCase, version: string): Promise<{ workspace: string; trees?: RunTrees }> {
  const workspace = await createWorkspace('review');
  copyFeature(workspace);
  await execOrThrow('git', ['add', '-A'], workspace);
  await execOrThrow('git', ['commit', '--quiet', '-m', 'feature-artifacts'], workspace);
  if (!atLeast(version, SNAPSHOTS_FROM)) {
    buildReviewCase(workspace, c);
    return { workspace };
  }
  const base = await snapshot(workspace);
  buildReviewCase(workspace, c);
  const round = await snapshot(workspace);
  const runDiff = await writeRunDiff(workspace, base, round);
  appendFileSync(
    join(workspace, FEATURE_PATH, 'loop-state.md'),
    `- BASE TREE: ${base}
- GATE BASELINE: ${base} — pass
- ROUND TREE 1: ${round}

### Gate touched

- round 1: none
${atLeast(version, SURFACES_FROM) ? `\n### Shared code touched\n\n- round 1: none\n\n${SURFACES}\n` : ''}${atLeast(version, RED_FIRST_FROM) ? RED_FIRST : ''}`,
  );
  return { workspace, trees: { base, round, runDiff } };
}

const lines = (text: string) => text.split(/\r?\n/).filter(Boolean);

/** The changed-file list step B of the measured version passes: tracked changes, plus untracked files from 0.16.2; from 0.17.0, the files that differ between the snapshots. */
export async function changedFiles(workspace: string, version: string, trees?: RunTrees): Promise<string[]> {
  if (trees) return lines(await execOrThrow('git', ['diff', '--name-only', trees.base, trees.round], workspace));
  const tracked = lines(await execOrThrow('git', ['diff', '--name-only'], workspace));
  if (!atLeast(version, '0.16.2')) return tracked;
  return [...tracked, ...lines(await execOrThrow('git', ['ls-files', '--others', '--exclude-standard'], workspace))];
}

/** The `## Reviewer` section of the plugin's model guide for this exact model, which step B pastes verbatim. */
export function reviewerGuide(pluginDir: string, modelId: string): string | undefined {
  const dir = join(pluginDir, 'references', 'model-guides');
  if (!existsSync(dir)) return undefined;
  const id = modelId.replace(/\[.*\]$/, '');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(dir, file), 'utf8').replace(/\r\n/g, '\n');
    if (/^model_id:\s*(.+)$/m.exec(text)?.[1]?.trim() !== id) continue;
    const start = text.indexOf('\n## Reviewer\n');
    if (start < 0) return undefined;
    const body = text.slice(start + '\n## Reviewer\n'.length);
    const end = body.indexOf('\n## ');
    return (end < 0 ? body : body.slice(0, end)).trim();
  }
  return undefined;
}

/** The DECISION LOG lines of the fixed state file, so the prompt and the file say the same. */
function decisionLog(): string {
  const state = readFileSync(join(REVIEW_DIR, 'feature', 'loop-state.md'), 'utf8');
  return lines(state).filter((line) => /^- D\d+ /.test(line)).join('\n');
}

function gateLine(gate: GateResult): string {
  const failing = (['test', 'typecheck', 'lint'] as const).filter((k) => !gate[k]);
  return failing.length ? `FAIL — ${failing.map((k) => `npm run ${k}`).join(', ')}` : 'pass — `npm test`, `npm run typecheck`, `npm run lint`';
}

export interface StepBInput {
  workspace: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  changed: string[];
  diffStat: string;
  gate: GateResult;
  guide?: string;
  /** From 0.17.0: the path of the run's unified diff. */
  runDiff?: string;
}

/** The orchestrator's implement step-B prompt for the measured version, handed to the main thread to dispatch verbatim. */
export function stepBPrompt(input: StepBInput): string {
  if (!atLeast(input.version, FIRST_VERSION) || atLeast(input.version, UNKNOWN_FROM)) {
    throw new Error(`the reviewer eval reproduces step B for ${FIRST_VERSION} up to before ${UNKNOWN_FROM}, not ${input.version}`);
  }
  if (atLeast(input.version, SNAPSHOTS_FROM) && !input.runDiff) throw new Error(`step B of ${input.version} passes RUN_DIFF`);
  const feature = join(input.workspace, FEATURE_PATH);
  const dispatch = [
    `INSTRUCTIONS: ${join(input.pluginDir, 'references', 'reviewer-instructions.md')}`,
    'PHASE: implement',
    'ROUND: 1',
    'RUN_MODE: default',
    `STATE_FILE: ${join(feature, 'loop-state.md')}`,
    `FEATURE_DIR: ${feature}`,
    `ARTIFACTS: ${['spec.md', 'plan.md', 'tasks.md'].map((f) => join(feature, f)).join(', ')}`,
    ...(input.runDiff ? [`RUN_DIFF: ${input.runDiff}`] : []),
    `CHANGED FILES: ${input.changed.join(', ')}`,
    'DIFF STAT:',
    input.diffStat,
    'DECISION LOG:',
    decisionLog(),
    `GATE RESULT: ${gateLine(input.gate)}`,
    ...(input.guide ? ['MODEL GUIDE:', input.guide] : []),
    'Read the state file first; interrogate per your profile (from round 2, verify the folds only); CLEAN requires evidence; do not re-report anything already resolved in the state file, DECISION LOG, or ASSUMPTION LOG.',
  ].join('\n');
  return [
    `Use the Agent tool once: subagent_type \`uroboros:uroboros-reviewer-${input.profile.effort}\`, model \`${input.profile.alias}\`, and as its prompt exactly the text between the markers. Wait for its report, then reply with the report verbatim and nothing else. Do not run, read or change anything yourself.`,
    '<<<',
    dispatch,
    '>>>',
  ].join('\n');
}

/** Status and item counts of one LOOP-REVIEW-FINDINGS report. */
export function parseReview(report: string | undefined): Pick<ReviewRun, 'reported' | 'status' | 'findings' | 'risks'> {
  if (!report) return { reported: false, findings: 0, risks: 0 };
  return {
    reported: true,
    status: /^\s*status:\s*(\w+)/m.exec(report)?.[1],
    findings: (report.match(/^\s*-\s*id:\s*F\d+/gm) ?? []).length,
    risks: (report.match(/^\s*-\s*id:\s*R\d+/gm) ?? []).length,
  };
}

/**
 * A catch needs the judge's yes and an item the orchestrator would act on: a report with no finding and no risk
 * (CLEAN) closes the phase, so naming the defect in passing — e.g. dismissed as already there — catches nothing.
 */
export function isCatch(judgeSaysCaught: boolean, run: Pick<ReviewRun, 'findings' | 'risks'>): boolean {
  return judgeSaysCaught && run.findings + run.risks > 0;
}

/** Asks the pinned judge whether any finding or risk of the report names the planted defect. */
async function judgeCatch(defect: string, report: string): Promise<{ caught: boolean; evidence: string; costUsd: number }> {
  const prompt = [
    'A code reviewer audited a change that contains exactly one planted defect.',
    `PLANTED DEFECT: ${defect}`,
    `REVIEWER REPORT:\n${report}`,
    'Does any finding or risk in the report identify this defect — what is wrong, where, or its effect? A finding about something else in the same file does not count, and neither does evidence listed under a CLEAN status. Quote the decisive finding or risk (at most 300 characters), or say why none matches.',
  ].join('\n\n');
  const schema = { type: 'object', properties: { caught: { type: 'boolean' }, evidence: { type: 'string' } }, required: ['caught', 'evidence'] };
  const { value, costUsd } = await askStructured<{ caught: boolean; evidence: string }>(JUDGE_MODEL, prompt, schema);
  return { ...value, costUsd };
}

/** A fingerprint of the working tree: status, tracked diff and the content of every untracked file. */
async function treeState(workspace: string): Promise<string> {
  const status = await execOrThrow('git', ['status', '--porcelain', '--untracked-files=all'], workspace);
  const hash = createHash('sha256').update(status).update((await exec('git', ['diff'], workspace)).output);
  for (const line of lines(status).filter((l) => l.startsWith('?? '))) hash.update(readFileSync(join(workspace, line.slice(3))));
  return hash.digest('hex');
}

interface ReviewModeRequest {
  runDir: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  oracle: Oracle;
}

/** Runs every case `REVIEW_EVAL_RUNS` times, sequentially, and scores the mode. */
export async function runReviewMode(req: ReviewModeRequest): Promise<ModeResult> {
  const startedAt = new Date().toISOString();
  const base = { mode: 'review' as const, startedAt, harnessCostUsd: 0, questionsAsked: 0 };
  if (!atLeast(req.version, FIRST_VERSION)) {
    return { ...base, durationMs: 0, costUsd: 0, tokens: sumTokens({}), models: [], e2e: { pass: true, checks: {} }, notApplicable: `the reviewer eval reproduces step B from uroboros ${FIRST_VERSION}` };
  }

  const askedBefore = req.oracle.asked;
  const usage: Record<string, ModelUsage>[] = [];
  const failures: string[] = [];
  const evaluation: ReviewerEval = { version: REVIEW_EVAL_VERSION, cases: [] };
  const guide = reviewerGuide(req.pluginDir, req.profile.modelId);
  let costUsd = 0;
  let judgeCostUsd = 0;
  let durationMs = 0;
  let aborted: string | undefined;

  for (const c of readReviewCases()) {
    const entry = { name: c.name, planted: c.defect !== null, runs: [] as ReviewRun[] };
    evaluation.cases.push(entry);
    for (let i = 1; i <= REVIEW_EVAL_RUNS && !aborted; i++) {
      const { workspace, trees } = await prepareWorkspace(c, req.version);
      const dir = join(req.runDir, 'review', `${c.name}-${i}`);
      mkdirSync(dir, { recursive: true });
      console.log(`[review] ${c.name} ${i}/${REVIEW_EVAL_RUNS} in ${workspace}`);
      const gate = await runGate(workspace);
      const prompt = stepBPrompt({
        workspace,
        pluginDir: req.pluginDir,
        version: req.version,
        profile: req.profile,
        changed: await changedFiles(workspace, req.version, trees),
        diffStat: await execOrThrow('git', trees ? ['diff', '--stat', trees.base, trees.round] : ['diff', '--stat'], workspace),
        gate,
        guide,
        runDiff: trees?.runDiff,
      });
      const before = await treeState(workspace);
      const transcriptPath = join(dir, 'transcript.jsonl');
      const session = await runSession({ mode: 'review', cwd: workspace, prompt, pluginDir: req.pluginDir, profile: req.profile, oracle: req.oracle, transcriptPath });
      costUsd += session.costUsd;
      durationMs += session.durationMs;
      usage.push(session.modelUsage);
      aborted = usageLimitError(session.error);
      if (aborted) break;
      const reports = subagentReports(transcriptPath, 'LOOP-REVIEW-FINDINGS');
      const report = reports[reports.length - 1];
      const run: ReviewRun = {
        ...parseReview(report),
        gateGreen: gate.test && gate.typecheck && gate.lint,
        touched: (await treeState(workspace)) !== before,
        costUsd: session.costUsd,
        durationMs: session.durationMs,
        error: session.error,
      };
      if (c.defect && report) {
        try {
          const verdict = await judgeCatch(c.defect, report);
          judgeCostUsd += verdict.costUsd;
          Object.assign(run, { caught: isCatch(verdict.caught, run), judgeEvidence: verdict.evidence });
        } catch (e) {
          failures.push(`${c.name}-${i}: judge: ${String(e).slice(0, 300)}`);
        }
      }
      entry.runs.push(run);
      if (session.error) failures.push(`${c.name}-${i}: ${session.error}`);
    }
    if (aborted) break;
  }

  const runs = evaluation.cases.flatMap((c) => c.runs);
  const merged: Record<string, ModelUsage> = {};
  usage.forEach((u, i) => Object.entries(u).forEach(([model, mu]) => (merged[`${model}#${i}`] = mu)));
  const checks = {
    'every run returned a report': runs.length > 0 && runs.every((r) => r.reported),
    'every case had a green gate': runs.every((r) => r.gateGreen),
    'no run changed the repo': runs.every((r) => !r.touched),
    'no session error': runs.every((r) => !r.error),
  };
  return {
    ...base,
    durationMs,
    costUsd,
    harnessCostUsd: judgeCostUsd,
    questionsAsked: req.oracle.asked - askedBefore,
    tokens: sumTokens(merged),
    models: [...new Set(usage.flatMap((u) => Object.keys(u)))],
    e2e: { pass: Object.values(checks).every(Boolean), checks },
    reviewerEval: evaluation,
    error: failures.length ? failures.join(' | ') : undefined,
    aborted,
  };
}
