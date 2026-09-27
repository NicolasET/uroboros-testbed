import type { ModelUsage } from '@anthropic-ai/claude-agent-sdk';
import type { EndToEnd } from './checks.ts';
import type { Mode } from './config.ts';
import type { AmbiguityScore } from './judge.ts';
import type { RoleProfile } from './model-profile.ts';
import type { UroborosSource } from './uroboros-source.ts';
import type { GateResult, HiddenTestsResult } from './verify.ts';

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
  ambiguity?: AmbiguityScore;
  error?: string;
}

export interface RunResult {
  label: string;
  scenarioVersion: number;
  uroboros: Omit<UroborosSource, 'dir'>;
  profile: RoleProfile;
  sdkVersion: string;
  startedAt: string;
  modes: ModeResult[];
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
