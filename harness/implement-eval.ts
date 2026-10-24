// The implement eval (`implement` mode): uroboros's implement phase alone. Each session resumes a run whose analyze has
// just closed, on a fixed feature (`scenario/implement/`) whose three user stories share no file — the case in which
// uroboros 0.25.0, under `--parallel=N`, runs one implementer per story at the same time (its implement protocol, "Waves").
// It measures what the pipeline modes cannot show, since their `tasks.md` puts every story's tests in one file: how long
// implement takes from the first implementer to the session's end, what the session costs, and how many implementers ran
// at once. From 0.25.0 the plugin is measured twice: as it runs by default, and with `--parallel=3`, one implementer per story.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ModelUsage } from '@anthropic-ai/claude-agent-sdk';
import { everyTaskChecked } from './checks.ts';
import { IMPLEMENT_EVAL_RUNS, IMPLEMENT_EVAL_VERSION, SCENARIO_DIR } from './config.ts';
import { execOrThrow } from './exec.ts';
import { readImplementerTimeline, summarizeImplementers, type ImplementerSummary } from './implementers.ts';
import { modelFlags, type RoleProfile } from './model-profile.ts';
import { Oracle } from './oracle.ts';
import { sumTokens, usageLimitError, type ModeResult } from './results.ts';
import { runSession, type SessionOutcome } from './session.ts';
import { runGate, runHiddenTestFile, type HiddenTestsResult } from './verify.ts';
import { atLeast } from './versions.ts';
import { createWorkspace } from './workspace.ts';

export const IMPLEMENT_DIR = join(SCENARIO_DIR, 'implement');
export const FEATURE = '001-order-lifecycle';
const FEATURE_PATH = join('specs', FEATURE);
const HIDDEN_TESTS = join(IMPLEMENT_DIR, 'hidden-tests', 'orders.acceptance.test.ts');
/** The fixed state file has the shape a 0.24.0 run leaves after analyze. */
export const FIRST_VERSION = '0.24.0';
/** From this version `--parallel=N` (N ≥ 2) runs one implementer per user story that shares no file with another (Waves). */
export const PARALLEL_FROM = '0.25.0';
/** The cap the parallel variant passes: the fixed feature has three independent user stories. */
const PARALLEL_CAP = 3;

export interface ImplementVariant {
  /** `single`: before 0.25.0, the one way implement runs; `default`: the plugin with no flag; `parallel=<N>`: with `--parallel=N`. */
  name: string;
  /** The flags the variant adds to the resume. */
  flags: string[];
}

export interface ImplementRun extends ImplementerSummary {
  costUsd: number;
  durationMs: number;
  tokens: ModeResult['tokens'];
  questionsAsked: number;
  gateGreen: boolean;
  everyTaskChecked: boolean;
  hidden: HiddenTestsResult;
  /** The `### Waves` section the run wrote in `loop-state.md` (0.25.0+); undefined when it wrote none. */
  waves?: string;
  error?: string;
}

export interface ImplementEval {
  version: number;
  variants: Array<ImplementVariant & { runs: ImplementRun[] }>;
}

/** Before 0.25.0 implement has one implementer and no `--parallel`; from it, the default and `--parallel=3`. */
export function variantsFor(version: string): ImplementVariant[] {
  return atLeast(version, PARALLEL_FROM)
    ? [
        { name: 'default', flags: [] },
        { name: `parallel=${PARALLEL_CAP}`, flags: [`--parallel=${PARALLEL_CAP}`] },
      ]
    : [{ name: 'single', flags: [] }];
}

/** The resume: no idea, the role model flags (so no model question), and the variant's flags. */
export function promptFor(profile: RoleProfile, variant: ImplementVariant): string {
  return ['/uroboros:run', modelFlags(profile), ...variant.flags].join(' ');
}

/** Fills every `{{KEY}}` of the state file's template; a placeholder with no value is an error. */
export function fillState(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`no value for ${placeholder}`);
    return value;
  });
}

/**
 * The fixture committed on `main`, then the feature branch with the artifacts, the state file, `.specify/feature.json`
 * and the run's marker left uncommitted, as a run interrupted after analyze leaves them. The state file records the
 * measured version and the role model, so the resume sees neither a version change nor a model to ask about.
 */
export async function prepareWorkspace(version: string, profile: RoleProfile): Promise<string> {
  const workspace = await createWorkspace('implement');
  const base = await execOrThrow('git', ['rev-parse', 'HEAD'], workspace);
  await execOrThrow('git', ['checkout', '--quiet', '-b', FEATURE], workspace);
  const feature = join(workspace, FEATURE_PATH);
  cpSync(join(IMPLEMENT_DIR, 'feature'), feature, { recursive: true });
  const state = fillState(readFileSync(join(feature, 'loop-state.md'), 'utf8'), {
    BASE_SHA: base,
    UROBOROS_VERSION: version,
    FLAGS: modelFlags(profile),
    ALIAS: profile.alias,
    EFFORT: profile.effort,
    MODEL_ID: profile.modelId,
  });
  writeFileSync(join(feature, 'loop-state.md'), state);
  writeFileSync(join(workspace, '.specify', 'feature.json'), `${JSON.stringify({ feature_directory: `specs/${FEATURE}` }, null, 2)}\n`);
  const marker = { mode: 'sdd', feature: FEATURE, dir: `specs/${FEATURE}`, state_file: `specs/${FEATURE}/loop-state.md`, session_id: /^SESSION: (\S+)$/m.exec(state)?.[1], status: 'active' };
  mkdirSync(join(workspace, '.uroboros'), { recursive: true });
  writeFileSync(join(workspace, '.uroboros', 'active-run.json'), `${JSON.stringify(marker)}\n`);
  return workspace;
}

/** The body of a state file's `### Waves` section, up to the next heading; undefined when there is none. */
export function wavesSection(state: string): string | undefined {
  const lines = state.split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{2,4} Waves\s*$/.test(line));
  if (start < 0) return undefined;
  const end = lines.findIndex((line, i) => i > start && /^#{1,4} /.test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
}

const readIfThere = (path: string): string => (existsSync(path) ? readFileSync(path, 'utf8') : '');

/** What one session left: the gate, the tasks, the hidden tests (copied in after the gate ran) and the implementers' timeline. */
async function measureRun(workspace: string, transcriptPath: string, session: SessionOutcome, questionsAsked: number): Promise<ImplementRun> {
  const feature = join(workspace, FEATURE_PATH);
  const gate = await runGate(workspace);
  return {
    ...summarizeImplementers(readImplementerTimeline(transcriptPath)),
    costUsd: session.costUsd,
    durationMs: session.durationMs,
    tokens: sumTokens(session.modelUsage),
    questionsAsked,
    gateGreen: gate.test && gate.typecheck && gate.lint,
    everyTaskChecked: everyTaskChecked(readIfThere(join(feature, 'tasks.md'))),
    hidden: await runHiddenTestFile(workspace, HIDDEN_TESTS),
    waves: wavesSection(readIfThere(join(feature, 'loop-state.md'))),
    error: session.error,
  };
}

interface ImplementModeRequest {
  runDir: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  /** The run's oracle log: this mode's oracle answers from its own truth file and logs there. */
  oracleLog: string;
}

/** Runs every variant `IMPLEMENT_EVAL_RUNS` times, sequentially, and measures each run. */
export async function runImplementMode(req: ImplementModeRequest): Promise<ModeResult> {
  const startedAt = new Date().toISOString();
  const base = { mode: 'implement' as const, startedAt, harnessCostUsd: 0, questionsAsked: 0 };
  if (!atLeast(req.version, FIRST_VERSION)) {
    return { ...base, durationMs: 0, costUsd: 0, tokens: sumTokens({}), models: [], e2e: { pass: true, checks: {} }, notApplicable: `the implement eval's state file has the shape of uroboros ${FIRST_VERSION}` };
  }

  const oracle = new Oracle(readFileSync(join(IMPLEMENT_DIR, 'truth.md'), 'utf8'), req.oracleLog);
  const evaluation: ImplementEval = { version: IMPLEMENT_EVAL_VERSION, variants: variantsFor(req.version).map((v) => ({ ...v, runs: [] })) };
  const usage: Record<string, ModelUsage>[] = [];
  const failures: string[] = [];
  let costUsd = 0;
  let durationMs = 0;
  let aborted: string | undefined;

  // The variants alternate run by run, so a slower hour of the API weighs on each of them alike.
  for (let i = 1; i <= IMPLEMENT_EVAL_RUNS && !aborted; i++) {
    for (const variant of evaluation.variants) {
      const workspace = await prepareWorkspace(req.version, req.profile);
      const dir = join(req.runDir, 'implement', `${variant.name}-${i}`);
      mkdirSync(dir, { recursive: true });
      console.log(`[implement] ${variant.name} ${i}/${IMPLEMENT_EVAL_RUNS} in ${workspace}`);
      const askedBefore = oracle.asked;
      const transcriptPath = join(dir, 'transcript.jsonl');
      const session = await runSession({ mode: 'implement', cwd: workspace, prompt: promptFor(req.profile, variant), pluginDir: req.pluginDir, profile: req.profile, oracle, transcriptPath });
      costUsd += session.costUsd;
      durationMs += session.durationMs;
      usage.push(session.modelUsage);
      aborted = usageLimitError(session.error);
      if (aborted) break;
      // Measuring must never crash the run: a run that could not be measured is recorded as a failure.
      try {
        variant.runs.push(await measureRun(workspace, transcriptPath, session, oracle.asked - askedBefore));
      } catch (e) {
        failures.push(`${variant.name}-${i}: measuring: ${String(e).slice(0, 300)}`);
      }
      if (session.error) failures.push(`${variant.name}-${i}: ${session.error}`);
    }
  }

  const runs = evaluation.variants.flatMap((v) => v.runs);
  const merged: Record<string, ModelUsage> = {};
  usage.forEach((u, i) => Object.entries(u).forEach(([model, mu]) => (merged[`${model}#${i}`] = mu)));
  const checks = {
    'every run measured': runs.length === IMPLEMENT_EVAL_RUNS * evaluation.variants.length,
    'an implementer ran in every run': runs.every((r) => r.dispatches > 0),
    'gate green in every run': runs.every((r) => r.gateGreen),
    'every task checked in every run': runs.every((r) => r.everyTaskChecked),
    'no session error': runs.every((r) => !r.error),
  };
  return {
    ...base,
    durationMs,
    costUsd,
    harnessCostUsd: oracle.costUsd,
    questionsAsked: oracle.asked,
    tokens: sumTokens(merged),
    models: [...new Set(usage.flatMap((u) => Object.keys(u)))],
    e2e: { pass: Object.values(checks).every(Boolean), checks },
    implementEval: evaluation,
    error: failures.length ? failures.join(' | ') : undefined,
    aborted,
  };
}
