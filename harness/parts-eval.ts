// The parts eval (`parts` mode, uroboros 1.0.0+): one idea that holds two features with nothing in common, by a user
// who wants them built at the same time. The main session runs intake for both, splits, and carries one part; the other
// part runs in its own session and git worktree (parts protocol). A session of this harness has no tool that starts
// another session, so the plugin falls back to "by hand": it creates the worktree and tells the user which command to
// run. The harness is that user: when a part's worktree and its finished draft exist, it starts the part's session with
// the prompt the protocol gives, while the main session is still running.
// It measures what no other mode reaches: whether the split happens, the part's draft carries what intake decided
// without the user's text, the part runs to its end in its worktree, and the main session waits and reports once.
import { existsSync, mkdirSync, readdirSync, readFileSync, type Dirent } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { featureDir, readIfExists } from './artifacts.ts';
import { PARTS_EVAL_VERSION, SCENARIO_DIR } from './config.ts';
import { exec } from './exec.ts';
import { ideaInProjectFiles, privateRecordDir, readFlow, type FlowShape } from './flow.ts';
import { modelFlags, type RoleProfile } from './model-profile.ts';
import { Oracle } from './oracle.ts';
import { sumTokens, usageLimitError, type ModeResult } from './results.ts';
import { runSession, type SessionOutcome } from './session.ts';
import { MEDIUM_HIDDEN_TESTS, SMALL_HIDDEN_TESTS } from './small-eval.ts';
import { atLeast, SINGLE_FLOW_FROM } from './versions.ts';
import { runGate, runHiddenTestFile, type GateResult, type HiddenTestsResult } from './verify.ts';
import { createWorkspace } from './workspace.ts';

export const PARTS_DIR = join(SCENARIO_DIR, 'parts');
/** A wall-clock guard for each session of this eval: a main session that waits for a part that never ends must not hold the run for hours. */
const PARTS_TIMEOUT_MS = 90 * 60 * 1000;
const POLL_MS = 5000;

export interface PartRun {
  slug: string;
  worktree: string;
  /** Its marker's status when its session ended (`complete`, `active`, `stopped`), or `none`. */
  markerStatus: string;
  /** The worktree had a `node_modules` of its own when the session ended: a new worktree has none, they are not tracked. A worktree inside the main checkout runs without one, since Node and npm look for modules in every folder above. */
  dependencies: boolean;
  gate?: GateResult;
  /** Both features' hidden tests, run in the worktree: which of them pass shows which part it built. */
  hidden: Record<string, HiddenTestsResult | undefined>;
  flow?: FlowShape;
  questions: number;
  costUsd: number;
  durationMs: number;
  /** The start of the idea as typed is in a file under the worktree's `.uroboros/`. */
  ideaInProjectFiles: boolean;
  /** Its own copy of what the user typed, `<slug>.md`, is in the repository's shared `.git`. */
  ownPrivateRecord: boolean;
  error?: string;
}

export interface PartsEval {
  version: number;
  /** The main session wrote a part draft and created a worktree for it. */
  split: boolean;
  parts: PartRun[];
  /** Questions the main session asked. */
  mainQuestions: number;
  /** Both features' hidden tests, run in the main checkout. */
  mainHidden: Record<string, HiddenTestsResult | undefined>;
  /** The main session's last message names every part. */
  jointReport: boolean;
  /** The main state file's `JOINT REPORT:` line, or `none`. */
  jointReportLine: string;
}

/** Worktrees of a repository other than the main checkout: path by the last segment of the path. */
export async function worktrees(workspace: string): Promise<Map<string, string>> {
  const { output } = await exec('git', ['worktree', 'list', '--porcelain'], workspace);
  const paths = output.split(/\r?\n/).filter((line) => line.startsWith('worktree ')).map((line) => line.slice('worktree '.length).trim());
  const found = new Map<string, string>();
  for (const path of paths) if (resolve(path) !== resolve(workspace)) found.set(path.split(/[\\/]/).pop()!, resolve(path));
  return found;
}

/** A part's draft is ready when intake is confirmed and the main session has added where the user's text is: the last thing it writes before starting the parts. */
export const draftReady = (draft: string): boolean => /^INTAKE:\s*confirmed/m.test(draft) && /^PRIVATE RECORD:\s*\S/m.test(draft);

/** A file or folder the main session may delete at any moment (it removes `.uroboros/parts/` after its joint report): what is there now, or nothing. */
function readNow<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

/** Part drafts the main session finished whose worktree exists: slug → draft path. */
export async function partsToStart(workspace: string): Promise<Map<string, { draft: string; worktree: string }>> {
  const dir = join(workspace, '.uroboros', 'parts');
  const ready = new Map<string, { draft: string; worktree: string }>();
  const trees = await worktrees(workspace);
  const entries: Dirent[] = readNow(() => readdirSync(dir, { withFileTypes: true })) ?? [];
  for (const entry of entries) {
    const draft = join(dir, entry.name, 'intake.md');
    const worktree = trees.get(entry.name);
    const text = entry.isDirectory() && worktree ? readNow(() => readFileSync(draft, 'utf8')) : undefined;
    if (worktree && text !== undefined && draftReady(text)) ready.set(entry.name, { draft, worktree });
  }
  return ready;
}

const markerStatus = (dir: string): string => {
  const path = join(dir, '.uroboros', 'active-run.json');
  return existsSync(path) ? ((JSON.parse(readFileSync(path, 'utf8')) as { status?: string }).status ?? 'none') : 'none';
};

/** Whether a command run in `dir` finds the project's dependencies: in `dir` or in a folder above it. */
export function resolvesDependencies(dir: string): boolean {
  for (let at = resolve(dir); ; at = dirname(at)) {
    if (existsSync(join(at, 'node_modules'))) return true;
    if (dirname(at) === at) return false;
  }
}

async function bothHidden(dir: string): Promise<Record<string, HiddenTestsResult | undefined>> {
  if (!resolvesDependencies(dir)) return { filter: undefined, startup: undefined };
  return { filter: await runHiddenTestFile(dir, MEDIUM_HIDDEN_TESTS), startup: await runHiddenTestFile(dir, SMALL_HIDDEN_TESTS) };
}

export interface PartsRequest {
  runDir: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  oracleLog: string;
}

export async function runPartsMode(req: PartsRequest): Promise<ModeResult> {
  const mode = 'parts' as const;
  const startedAt = new Date().toISOString();
  const base = { mode, startedAt, harnessCostUsd: 0, questionsAsked: 0 };
  if (!atLeast(req.version, SINGLE_FLOW_FROM)) {
    return { ...base, durationMs: 0, costUsd: 0, tokens: sumTokens({}), models: [], e2e: { pass: true, checks: {} }, notApplicable: `the parts eval follows the parts protocol of the single flow, uroboros ${SINGLE_FLOW_FROM}+` };
  }

  const idea = readFileSync(join(PARTS_DIR, 'idea.md'), 'utf8').trim();
  const truth = readFileSync(join(PARTS_DIR, 'truth.md'), 'utf8');
  const mainOracle = new Oracle(truth, req.oracleLog);
  const workspace = await createWorkspace(mode);
  mkdirSync(join(req.runDir, mode), { recursive: true });
  const transcriptPath = join(req.runDir, mode, 'transcript.jsonl');
  const models = modelFlags(req.profile);

  console.log(`[${mode}] main session in ${workspace}`);
  let mainDone = false;
  const main = runSession({ mode, cwd: workspace, prompt: `/uroboros:run ${models} ${idea}`, pluginDir: req.pluginDir, profile: req.profile, oracle: mainOracle, transcriptPath, timeoutMs: PARTS_TIMEOUT_MS }).finally(() => (mainDone = true));

  // The harness plays the user of the "by hand" path: it starts each part once its worktree and its draft are ready.
  const started = new Map<string, { worktree: string; oracle: Oracle; transcript: string; session: Promise<SessionOutcome> }>();
  while (!mainDone) {
    for (const [slug, part] of await partsToStart(workspace)) {
      if (started.has(slug)) continue;
      const oracle = new Oracle(truth, req.oracleLog);
      const transcript = join(req.runDir, mode, `part-${slug}.jsonl`);
      console.log(`[${mode}] part ${slug} starts in ${part.worktree}`);
      started.set(slug, {
        worktree: part.worktree,
        oracle,
        transcript,
        session: runSession({
          mode,
          cwd: part.worktree,
          prompt: `/uroboros:run --part=${part.draft} ${models}`,
          pluginDir: req.pluginDir,
          profile: req.profile,
          oracle,
          transcriptPath: transcript,
          // The part reads its draft in the main checkout and the user's text in the shared .git.
          extraAllowed: [workspace],
          tmpDir: `${workspace}-tmp-${slug}`,
          timeoutMs: PARTS_TIMEOUT_MS,
        }),
      });
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  const mainOutcome = await main;
  const partOutcomes = await Promise.all([...started].map(async ([slug, p]) => ({ slug, ...p, outcome: await p.session })));

  const sessions = [mainOutcome, ...partOutcomes.map((p) => p.outcome)];
  const usage = Object.fromEntries(sessions.flatMap((s, i) => Object.entries(s.modelUsage).map(([k, v]) => [`${k}#${i}`, v])));
  const questionsAsked = mainOracle.asked + partOutcomes.reduce((n, p) => n + p.oracle.asked, 0);
  const measured = {
    durationMs: mainOutcome.durationMs,
    costUsd: sessions.reduce((n, s) => n + s.costUsd, 0),
    tokens: sumTokens(usage),
    models: [...new Set(sessions.flatMap((s) => Object.keys(s.modelUsage)))],
    questionsAsked,
  };
  const limit = sessions.map((s) => usageLimitError(s.error)).find(Boolean);
  if (limit) return { ...base, ...measured, e2e: { pass: false, checks: {} }, aborted: limit };

  const failures: string[] = sessions.map((s) => s.error).filter((e): e is string => !!e);
  const measure = async <T>(step: string, fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (e) {
      failures.push(`${step}: ${String(e).slice(0, 500)}`);
      return undefined;
    }
  };

  const gate = await measure('gate', () => runGate(workspace));
  const mainHidden = (await measure('hidden tests', () => bothHidden(workspace))) ?? {};
  const flow = await measure('flow', async () => readFlow(workspace, transcriptPath));
  const parts: PartRun[] = [];
  for (const p of partOutcomes) {
    const dependencies = existsSync(join(p.worktree, 'node_modules'));
    parts.push({
      slug: p.slug,
      worktree: p.worktree,
      markerStatus: markerStatus(p.worktree),
      dependencies,
      gate: resolvesDependencies(p.worktree) ? await measure(`gate of ${p.slug}`, () => runGate(p.worktree)) : undefined,
      hidden: (await measure(`hidden tests of ${p.slug}`, () => bothHidden(p.worktree))) ?? {},
      flow: await measure(`flow of ${p.slug}`, async () => readFlow(p.worktree, p.transcript)),
      questions: p.oracle.asked,
      costUsd: p.outcome.costUsd,
      durationMs: p.outcome.durationMs,
      ideaInProjectFiles: !!ideaInProjectFiles(p.worktree, idea),
      ownPrivateRecord: existsSync(join(privateRecordDir(p.worktree), `${p.slug}.md`)),
      error: p.outcome.error,
    });
  }
  const mainFeature = featureDir(workspace, '.uroboros');
  const state = readIfExists(mainFeature && join(mainFeature, 'loop-state.md'), Number.MAX_SAFE_INTEGER);
  const partsEval: PartsEval = {
    version: PARTS_EVAL_VERSION,
    split: parts.length > 0,
    parts,
    mainQuestions: mainOracle.asked,
    mainHidden,
    jointReport: parts.length > 0 && parts.every((p) => mainOutcome.finalText.includes(p.slug)),
    jointReportLine: /^JOINT REPORT:\s*(.+)$/m.exec(state)?.[1]?.trim() ?? 'none',
  };

  const passed = (h: HiddenTestsResult | undefined) => !!h && h.total > 0 && h.passed === h.total;
  const builtIn = (h: Record<string, HiddenTestsResult | undefined>) => [passed(h.filter), passed(h.startup)];
  const [mainFilter, mainStartup] = builtIn(mainHidden);
  const checks: Record<string, boolean> = {
    'no session error': failures.length === 0,
    'the idea was split and a part started in its own worktree': partsEval.split,
    'the main session built one feature, and only that one': mainFilter !== mainStartup,
    'every part closed its run as complete': parts.length > 0 && parts.every((p) => p.markerStatus === 'complete'),
    'every part built the other feature, and only that one': parts.length > 0 && parts.every((p) => {
      const [filter, startup] = builtIn(p.hidden);
      return filter !== startup && filter !== mainFilter;
    }),
    'the main session closed its run as complete': markerStatus(workspace) === 'complete',
    'the main gate is green': !!gate && gate.test && gate.typecheck && gate.lint,
    'the main session reported once, naming every part': partsEval.jointReport,
    'every part keeps its own record of what the user typed in the shared .git': parts.length > 0 && parts.every((p) => p.ownPrivateRecord),
    'the idea as typed is in no project file': !ideaInProjectFiles(workspace, idea) && parts.every((p) => !p.ideaInProjectFiles),
  };

  return {
    ...base,
    ...measured,
    harnessCostUsd: mainOracle.costUsd + partOutcomes.reduce((n, p) => n + p.oracle.costUsd, 0),
    e2e: { pass: Object.values(checks).every(Boolean), checks },
    gate,
    flow,
    partsEval,
    error: failures.length ? failures.join(' | ') : undefined,
  };
}
