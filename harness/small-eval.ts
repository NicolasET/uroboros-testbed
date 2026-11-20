// The sized evals (uroboros 1.0.0+), `small` and `medium`: one idea each, run in default mode on the same fixture, with
// its own truth for the oracle. They measure what the pipeline modes cannot show, since their idea adds a state to stored
// data and is sized large: how much of the loop a smaller change goes through (the size recorded, the subagents
// dispatched, whether goal.md was reviewed on its own, whether a plan was written), with its questions, cost and time,
// and whether the change was built (hidden tests).
// - `small`: the text the server prints when it starts — small by every signal.
// - `medium`: a maximum price filter on the search — new behavior in one flow, on a contract others consume.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkEndToEnd } from './checks.ts';
import { MEDIUM_EVAL_VERSION, SCENARIO_DIR, SMALL_EVAL_VERSION } from './config.ts';
import { readFlow } from './flow.ts';
import { modelFlags, type RoleProfile } from './model-profile.ts';
import { Oracle } from './oracle.ts';
import { sumTokens, usageLimitError, type ModeResult } from './results.ts';
import { runSession } from './session.ts';
import { atLeast, SINGLE_FLOW_FROM } from './versions.ts';
import { runGate, runHiddenTestFile } from './verify.ts';
import { scoreVerifier } from './verifier.ts';
import { createWorkspace } from './workspace.ts';

export type SizedMode = 'small' | 'medium';

export const SMALL_DIR = join(SCENARIO_DIR, 'small');
export const SMALL_HIDDEN_TESTS = join(SMALL_DIR, 'startup.test.ts');
export const MEDIUM_DIR = join(SCENARIO_DIR, 'medium');
export const MEDIUM_HIDDEN_TESTS = join(MEDIUM_DIR, 'max-price.test.ts');

const SIZED: Record<SizedMode, { dir: string; hiddenTests: string }> = {
  small: { dir: SMALL_DIR, hiddenTests: SMALL_HIDDEN_TESTS },
  medium: { dir: MEDIUM_DIR, hiddenTests: MEDIUM_HIDDEN_TESTS },
};

export interface SizedRequest {
  runDir: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  oracleLog: string;
}

export async function runSizedMode(mode: SizedMode, req: SizedRequest): Promise<ModeResult> {
  const startedAt = new Date().toISOString();
  const base = { mode, startedAt, harnessCostUsd: 0, questionsAsked: 0 };
  if (!atLeast(req.version, SINGLE_FLOW_FROM)) {
    return { ...base, durationMs: 0, costUsd: 0, tokens: sumTokens({}), models: [], e2e: { pass: true, checks: {} }, notApplicable: `the size of the idea sets the route only from uroboros ${SINGLE_FLOW_FROM}` };
  }

  const scenario = SIZED[mode];
  const idea = readFileSync(join(scenario.dir, 'idea.md'), 'utf8').trim();
  // Its own oracle: this user knows this idea, not the pause feature.
  const oracle = new Oracle(readFileSync(join(scenario.dir, 'truth.md'), 'utf8'), req.oracleLog);
  const workspace = await createWorkspace(mode);
  mkdirSync(join(req.runDir, mode), { recursive: true });
  const transcriptPath = join(req.runDir, mode, 'transcript.jsonl');

  console.log(`[${mode}] running in ${workspace}`);
  const session = await runSession({ mode, cwd: workspace, prompt: `/uroboros:run ${modelFlags(req.profile)} ${idea}`, pluginDir: req.pluginDir, profile: req.profile, oracle, transcriptPath });

  const measured = { durationMs: session.durationMs, costUsd: session.costUsd, tokens: sumTokens(session.modelUsage), models: Object.keys(session.modelUsage), questionsAsked: oracle.asked };
  const limit = usageLimitError(session.error);
  if (limit) return { ...base, ...measured, e2e: { pass: false, checks: {} }, aborted: limit };

  // Measuring must never crash the run: a failed step is recorded on this mode and the next mode still runs.
  const failures: string[] = session.error ? [session.error] : [];
  const measure = async <T>(step: string, fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (e) {
      failures.push(`${step}: ${String(e).slice(0, 500)}`);
      return undefined;
    }
  };
  const gate = await measure('gate', () => runGate(workspace));
  const hidden = await measure('hidden tests', () => runHiddenTestFile(workspace, scenario.hiddenTests));
  const flow = await measure('flow', async () => readFlow(workspace, transcriptPath));
  const verifier = await measure('verifier reports', async () => scoreVerifier(transcriptPath));
  const e2e = (await measure('end-to-end checks', () => checkEndToEnd({ mode, version: req.version, idea, workspace, session, questionsAsked: oracle.asked, gate }))) ?? {
    pass: false,
    checks: { 'checks could run': false },
  };

  const evalVersion = mode === 'small' ? { smallEvalVersion: SMALL_EVAL_VERSION } : { mediumEvalVersion: MEDIUM_EVAL_VERSION };
  return { ...base, ...measured, harnessCostUsd: oracle.costUsd, e2e, gate, hidden, verifier, flow, ...evalVersion, error: failures.length ? failures.join(' | ') : undefined };
}
