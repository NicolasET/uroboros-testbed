// The resume eval (`resume` mode, uroboros 1.0.0+): a run cut while its implementer works, then resumed by another
// session. The first session runs the small idea in default mode and is killed the moment its first implementer starts —
// the state file then holds an open dispatch of a session that no longer exists. A second session, with no idea, resumes.
// It measures what no other mode reaches: whether the resume takes the marker over, sends the lost dispatch again, leaves
// goal.md as intake wrote it, asks nothing of intake again, and carries the run to its end. The SDK reports no cost for
// a session that is cut, so the mode's cost is the resuming session's alone.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureDir } from './artifacts.ts';
import { checkEndToEnd } from './checks.ts';
import { RESUME_EVAL_VERSION } from './config.ts';
import { dispatches, readFlow } from './flow.ts';
import { modelFlags, type RoleProfile } from './model-profile.ts';
import { Oracle } from './oracle.ts';
import { sumTokens, usageLimitError, type ModeResult } from './results.ts';
import { runSession } from './session.ts';
import { SMALL_DIR, SMALL_HIDDEN_TESTS } from './small-eval.ts';
import { atLeast, SINGLE_FLOW_FROM } from './versions.ts';
import { runGate, runHiddenTestFile } from './verify.ts';
import { createWorkspace } from './workspace.ts';

export interface ResumeEval {
  version: number;
  /** The first session was cut when its first implementer started; false when it ended before reaching one. */
  interrupted: boolean;
  /** What the first session had dispatched when it was cut, by role. */
  before: Record<string, number>;
  /** What the resuming session dispatched, by role. */
  after: Record<string, number>;
  /** The marker named the first session when it was cut, and the resuming session wrote its own id into it. */
  markerTakenOver: boolean;
  /** goal.md is byte for byte what the first session left. */
  goalUnchanged: boolean;
  /** Questions the resuming session asked. */
  questionsOnResume: number;
  firstCostUsd: number;
  firstDurationMs: number;
}

interface Marker {
  session_id?: string;
  status?: string;
}

const readMarker = (workspace: string): Marker | undefined => {
  const path = join(workspace, '.uroboros', 'active-run.json');
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Marker) : undefined;
};

const hashOf = (path: string | undefined): string | undefined => (path && existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : undefined);

const countByRole = (transcriptPath: string): Record<string, number> => {
  const counts: Record<string, number> = { implementer: 0, reviewer: 0, refuter: 0, verifier: 0 };
  for (const d of dispatches(transcriptPath)) counts[d.role] = (counts[d.role] ?? 0) + 1;
  return counts;
};

/** A subagent of the implementer agent has started: the orchestrator recorded the dispatch before the call. */
export function implementerStarted(message: unknown): boolean {
  const m = message as { type?: string; subtype?: string; subagent_type?: unknown };
  return m.type === 'system' && m.subtype === 'task_started' && typeof m.subagent_type === 'string' && /uroboros-implementer/.test(m.subagent_type);
}

/** The one question a resume may ask: the marker names a session that is gone (SKILL.md, The marker — one active run per repo). */
const TAKE_OVER = '- Asked whether to take over the run that an earlier session of mine left unfinished, or to stop: take it over.';

export interface ResumeRequest {
  runDir: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  oracleLog: string;
}

export async function runResumeMode(req: ResumeRequest): Promise<ModeResult> {
  const mode = 'resume' as const;
  const startedAt = new Date().toISOString();
  const base = { mode, startedAt, harnessCostUsd: 0, questionsAsked: 0 };
  if (!atLeast(req.version, SINGLE_FLOW_FROM)) {
    return { ...base, durationMs: 0, costUsd: 0, tokens: sumTokens({}), models: [], e2e: { pass: true, checks: {} }, notApplicable: `the resume eval resumes a run of the single flow, uroboros ${SINGLE_FLOW_FROM}+` };
  }

  const idea = readFileSync(join(SMALL_DIR, 'idea.md'), 'utf8').trim();
  // The small idea's user, who also knows what to say when the resume finds the run under another session's name.
  const oracle = new Oracle(`${readFileSync(join(SMALL_DIR, 'truth.md'), 'utf8').trimEnd()}
${TAKE_OVER}
`, req.oracleLog);
  const workspace = await createWorkspace(mode);
  mkdirSync(join(req.runDir, mode), { recursive: true });
  const firstTranscript = join(req.runDir, mode, 'first-transcript.jsonl');
  const transcriptPath = join(req.runDir, mode, 'transcript.jsonl');
  const models = modelFlags(req.profile);

  console.log(`[${mode}] first session in ${workspace}, cut when its implementer starts`);
  const first = await runSession({ mode, cwd: workspace, prompt: `/uroboros:run ${models} ${idea}`, pluginDir: req.pluginDir, profile: req.profile, oracle, transcriptPath: firstTranscript, stopWhen: implementerStarted });
  const firstLimit = usageLimitError(first.error);
  if (firstLimit) return { ...base, durationMs: first.durationMs, costUsd: first.costUsd, tokens: sumTokens(first.modelUsage), models: Object.keys(first.modelUsage), e2e: { pass: false, checks: {} }, aborted: firstLimit };

  const markerBefore = readMarker(workspace);
  const goalPath = () => {
    const dir = featureDir(workspace, '.uroboros');
    return dir && join(dir, 'goal.md');
  };
  const goalBefore = hashOf(goalPath());
  const askedBefore = oracle.asked;

  // The resume: no idea, and the model flags, so the recorded choices are not asked again.
  console.log(`[${mode}] second session resumes`);
  const second = await runSession({ mode, cwd: workspace, prompt: `/uroboros:run ${models}`, pluginDir: req.pluginDir, profile: req.profile, oracle, transcriptPath });
  const costUsd = first.costUsd + second.costUsd;
  const durationMs = first.durationMs + second.durationMs;
  const usage = { ...Object.fromEntries(Object.entries(first.modelUsage).map(([k, v]) => [`${k}#1`, v])), ...Object.fromEntries(Object.entries(second.modelUsage).map(([k, v]) => [`${k}#2`, v])) };
  const measured = { durationMs, costUsd, tokens: sumTokens(usage), models: [...new Set([...Object.keys(first.modelUsage), ...Object.keys(second.modelUsage)])], questionsAsked: oracle.asked };
  const limit = usageLimitError(second.error);
  if (limit) return { ...base, ...measured, e2e: { pass: false, checks: {} }, aborted: limit };

  const failures: string[] = [first.error, second.error].filter((e): e is string => !!e);
  const measure = async <T>(step: string, fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (e) {
      failures.push(`${step}: ${String(e).slice(0, 500)}`);
      return undefined;
    }
  };
  const gate = await measure('gate', () => runGate(workspace));
  const hidden = await measure('hidden tests', () => runHiddenTestFile(workspace, SMALL_HIDDEN_TESTS));
  const flow = await measure('flow', async () => readFlow(workspace, transcriptPath));
  const markerAfter = readMarker(workspace);
  const resumeEval: ResumeEval = {
    version: RESUME_EVAL_VERSION,
    interrupted: !!first.stopped,
    before: countByRole(firstTranscript),
    after: countByRole(transcriptPath),
    markerTakenOver: !!markerBefore?.session_id && !!markerAfter?.session_id && markerBefore.session_id !== markerAfter.session_id,
    goalUnchanged: goalBefore !== undefined && goalBefore === hashOf(goalPath()),
    questionsOnResume: oracle.asked - askedBefore,
    firstCostUsd: first.costUsd,
    firstDurationMs: first.durationMs,
  };
  const e2e = (await measure('end-to-end checks', () => checkEndToEnd({ mode, version: req.version, idea, workspace, session: second, questionsAsked: oracle.asked, gate }))) ?? { pass: false, checks: { 'checks could run': false } };
  Object.assign(e2e.checks, {
    'the first session was cut with its implementer running': resumeEval.interrupted && markerBefore?.status === 'active',
    'the resume took the marker over': resumeEval.markerTakenOver,
    'the resume sent the lost implementer dispatch again': (resumeEval.after.implementer ?? 0) > 0,
    'the resume left goal.md as it was': resumeEval.goalUnchanged,
    'the resume asked at most whether to take the run over': resumeEval.questionsOnResume <= 1,
  });
  e2e.pass = Object.values(e2e.checks).every(Boolean);

  return { ...base, ...measured, harnessCostUsd: oracle.costUsd, e2e, gate, hidden, flow, resumeEval, error: failures.length ? failures.join(' | ') : undefined };
}
