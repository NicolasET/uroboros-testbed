import { appendFileSync } from 'node:fs';
import { query, type ModelUsage, type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
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
 * Runs one uroboros invocation to its real end. Subagents run in the background, so a session yields a
 * result each time a turn ends and starts a new turn when a subagent reports. The input stays open until a
 * result arrives with no background task left: a closed input makes every later permission request fail.
 */
export async function runSession(req: SessionRequest): Promise<SessionOutcome> {
  const started = Date.now();
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), SESSION_TIMEOUT_MS);
  const outcome: SessionOutcome = { costUsd: 0, durationMs: 0, modelUsage: {}, finalText: '' };

  let closeInput!: () => void;
  const inputClosed = new Promise<void>((resolve) => (closeInput = resolve));
  async function* input(): AsyncGenerator<SDKUserMessage> {
    yield { type: 'user', message: { role: 'user', content: req.prompt }, parent_tool_use_id: null, session_id: '' };
    await inputClosed;
  }
  let liveTasks = 0;

  try {
    for await (const m of query({
      prompt: input(),
      options: {
        cwd: req.cwd,
        plugins: [{ type: 'local', path: req.pluginDir }],
        model: req.profile.alias,
        effort: req.profile.effort,
        // Project settings only: the workspace's spec-kit skills load; nothing from this machine's user
        // settings, hooks, CLAUDE.md or MCP servers does (the workspace root is checked by workspace.ts).
        settingSources: ['project'],
        // Not bypassPermissions: that mode approves calls before canUseTool runs, and the oracle lives
        // in canUseTool. Every other tool is approved there instead.
        permissionMode: 'default',
        abortController,
        canUseTool: async (toolName, toolInput) => {
          if (toolName !== 'AskUserQuestion') return { behavior: 'allow', updatedInput: toolInput };
          const questions = (toolInput as { questions: AskedQuestion[] }).questions;
          const answers = await req.oracle.answer(req.mode, questions);
          return { behavior: 'allow', updatedInput: { questions, answers } };
        },
      },
    })) {
      appendFileSync(req.transcriptPath, JSON.stringify(m) + '\n');
      // Tasks reaching zero is not the end: the SDK then opens a turn to deliver the subagent's report.
      if (m.type === 'system' && m.subtype === 'background_tasks_changed') liveTasks = m.tasks.filter((t) => !t.ambient).length;
      if (m.type === 'result') {
        // Each result carries the running total: keep the latest, never sum.
        outcome.costUsd = m.total_cost_usd;
        outcome.modelUsage = m.modelUsage ?? {};
        if (m.subtype === 'success') {
          outcome.finalText = m.result;
          outcome.error = undefined;
        } else {
          outcome.error = m.subtype;
        }
        if (liveTasks === 0) closeInput();
      }
    }
  } catch (e) {
    outcome.error = abortController.signal.aborted ? `timeout after ${SESSION_TIMEOUT_MS} ms` : String(e);
  } finally {
    closeInput();
    clearTimeout(timer);
    outcome.durationMs = Date.now() - started;
  }
  return outcome;
}
