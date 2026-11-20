import type { ModelUsage } from '@anthropic-ai/claude-agent-sdk';
import type { EndToEnd } from './checks.ts';
import type { Mode } from './config.ts';
import type { ImplementEval } from './implement-eval.ts';
import type { AmbiguityScore } from './judge.ts';
import type { RoleProfile } from './model-profile.ts';
import type { ReviewerEval } from './review-eval.ts';
import type { EarlierScore } from './earlier.ts';
import type { FlowShape } from './flow.ts';
import type { PartsEval } from './parts-eval.ts';
import type { ResumeEval } from './resume-eval.ts';
import type { UroborosSource } from './uroboros-source.ts';
import type { GateResult, HiddenTestsResult } from './verify.ts';
import type { VerifierEval } from './verify-eval.ts';
import type { VerifierScore } from './verifier.ts';

export interface ModeResult {
  mode: Mode;
  startedAt: string;
  durationMs: number;
  /** uroboros session only (orchestrator + subagents), list-price estimate. */
  costUsd: number;
  /** Oracle and judge calls, kept apart so they never blur the plugin's own cost. */
  harnessCostUsd: number;
  tokens: { input: number; output: number; cacheRead: number; cacheCreation: number };
  models: string[];
  questionsAsked: number;
  e2e: EndToEnd;
  gate?: GateResult;
  hidden?: HiddenTestsResult;
  /** Hidden tests that start the real server (scenario v6+). */
  runtime?: HiddenTestsResult;
  /** The VERIFIER-REPORTs the session received; absent when no verifier ran. */
  verifier?: VerifierScore;
  /** `verify` mode only: detection and noise of the verifier on planted defects and a clean copy. */
  verifierEval?: VerifierEval;
  /** `review` mode only: detection of the reviewer on planted defects, and what it reports on a clean copy. */
  reviewerEval?: ReviewerEval;
  /** `implement` mode only: the implement phase's duration, cost and concurrency on a fixed feature, per variant. */
  implementEval?: ImplementEval;
  /** Single-flow runs (uroboros 1.0.0+): the size recorded, the subagents dispatched, where the user's text was kept. */
  flow?: FlowShape;
  /** `small` mode only: the small eval version this result was measured with. */
  smallEvalVersion?: number;
  /** `medium` mode only: the medium eval version this result was measured with. */
  mediumEvalVersion?: number;
  /** `resume` mode only: what the cut and the resume did. */
  resumeEval?: ResumeEval;
  /** `parts` mode only: the split, each part's run and the joint report. */
  partsEval?: PartsEval;
  /** Set when the mode does not apply to this uroboros version (e.g. `verify` before the verifier existed). */
  notApplicable?: string;
  ambiguity?: AmbiguityScore;
  /** Scenario v9+, modes seeded with the earlier feature: its decisions the idea changes, one it leaves alone, lists answered "I don't know". */
  earlier?: EarlierScore;
  /** Scenario v7–v8 only (committed results): the standing decisions. Never written since v9. */
  standing?: unknown;
  error?: string;
  /** Set when the account's usage or rate limit cut the mode short: its numbers measure nothing, re-run it. */
  aborted?: string;
}

export interface RunResult {
  label: string;
  scenarioVersion: number;
  /** The verifier eval version (`verify` mode), compared apart from the scenario version. */
  verifyEvalVersion?: number;
  /** The reviewer eval version (`review` mode), compared apart from the scenario version. */
  reviewEvalVersion?: number;
  /** The implement eval version (`implement` mode), compared apart from the scenario version. */
  implementEvalVersion?: number;
  /** The small eval version (`small` mode), compared apart from the scenario version. */
  smallEvalVersion?: number;
  /** The medium eval version (`medium` mode), compared apart from the scenario version. */
  mediumEvalVersion?: number;
  /** The resume eval version (`resume` mode), compared apart from the scenario version. */
  resumeEvalVersion?: number;
  /** The parts eval version (`parts` mode), compared apart from the scenario version. */
  partsEvalVersion?: number;
  uroboros: Omit<UroborosSource, 'dir'>;
  profile: RoleProfile;
  sdkVersion: string;
  startedAt: string;
  modes: ModeResult[];
}

/** Errors that come from the account, not from uroboros: a mode cut short by one of these is re-run, never scored. */
export function usageLimitError(error: string | undefined): string | undefined {
  return error && /hit your (weekly|session|daily|usage) limit|usage limit|rate limit|credit balance/i.test(error) ? error : undefined;
}

export function sumTokens(usage: Record<string, ModelUsage>): ModeResult['tokens'] {
  const all = Object.values(usage);
  const sum = (pick: (u: ModelUsage) => number) => all.reduce((n, u) => n + pick(u), 0);
  return {
    input: sum((u) => u.inputTokens),
    output: sum((u) => u.outputTokens),
    cacheRead: sum((u) => u.cacheReadInputTokens),
    cacheCreation: sum((u) => u.cacheCreationInputTokens),
  };
}
