import { appendFileSync } from 'node:fs';
import { query, type ModelUsage } from '@anthropic-ai/claude-agent-sdk';
import { SESSION_TIMEOUT_MS, type Mode } from './config.ts';
import type { RoleProfile } from './model-profile.ts';
import type { AskedQuestion, Oracle } from './oracle.ts';

export interface SessionOutcome {
  costUsd: number;
  durationMs: number;
  modelUsage: Record<string, ModelUsage>;
  /** Text of the last result — the Loop Report, or the compat report. */
  finalText: string;
  error?: string;
}

export interface SessionRequest {
  mode: Mode;
  cwd: string;
  prompt: string;
  pluginDir: string;
  profile: RoleProfile;
  oracle: Oracle;
  transcriptPath: string;
}

/**
 * Runs one uroboros invocation to its real end: subagents run in the background, so a session
 * yields several results; the stream closes only when nothing is left running.
 */
export async function runSession(req: SessionRequest): Promise<SessionOutcome> {
  const started = Date.now();
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), SESSION_TIMEOUT_MS);
  const outcome: SessionOutcome = { costUsd: 0, durationMs: 0, modelUsage: {}, finalText: '' };

  try {
    for await (const m of query({
      prompt: req.prompt,
      options: {
        cwd: req.cwd,
        plugins: [{ type: 'local', path: req.pluginDir }],
        model: req.profile.alias,
        effort: req.profile.effort,
        // Isolated: no user or project settings, hooks, CLAUDE.md or MCP servers of this machine.
        settingSources: [],
        // Not bypassPermissions: that mode approves calls before canUseTool runs, and the oracle lives
        // in canUseTool. Every other tool is approved there instead.
        permissionMode: 'default',
        abortController,
        canUseTool: async (toolName, input) => {
          if (toolName !== 'AskUserQuestion') return { behavior: 'allow', updatedInput: input };
          const questions = (input as { questions: AskedQuestion[] }).questions;
          const answers = await req.oracle.answer(req.mode, questions);
          return { behavior: 'allow', updatedInput: { questions, answers } };
        },
      },
    })) {
      appendFileSync(req.transcriptPath, JSON.stringify(m) + '\n');
      if (m.type === 'result') {
        // Each result carries the running total: keep the latest, never sum.
        outcome.costUsd = m.total_cost_usd;
        outcome.modelUsage = m.modelUsage ?? {};
        if (m.subtype === 'success') outcome.finalText = m.result;
        else outcome.error = m.subtype;
      }
    }
  } catch (e) {
    outcome.error = abortController.signal.aborted ? `timeout after ${SESSION_TIMEOUT_MS} ms` : String(e);
  } finally {
    clearTimeout(timer);
    outcome.durationMs = Date.now() - started;
  }
  return outcome;
}
