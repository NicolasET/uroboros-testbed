import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { query, type EffortLevel, type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
import { PROBE_PLUGIN_DIR, ROLE_MODEL_ALIAS } from './config.ts';

export interface RoleProfile {
  /** Passed to uroboros and to the orchestrator session: resolves to the latest Opus. */
  alias: string;
  /** The exact model the alias resolved to at run start. */
  modelId: string;
  /** The model's own default effort (what Claude Code uses interactively), not the SDK's `high` fallback. */
  effort: EffortLevel;
  claudeCodeVersion: string;
}

const EFFORTS: readonly EffortLevel[] = ['low', 'medium', 'high', 'xhigh', 'max'];

/**
 * Opens a throwaway session on the role model, resets its effort to the model default
 * (`effortLevel: null`), and reads back the effort it runs at through the probe skill.
 */
export async function resolveRoleProfile(): Promise<RoleProfile> {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => (release = resolve));
  async function* input(): AsyncGenerator<SDKUserMessage> {
    await ready;
    yield { type: 'user', message: { role: 'user', content: '/probe:effort' }, parent_tool_use_id: null, session_id: '' };
  }

  const session = query({
    prompt: input(),
    options: {
      cwd: mkdtempSync(join(tmpdir(), 'uro-testbed-probe-')),
      model: ROLE_MODEL_ALIAS,
      plugins: [{ type: 'local', path: PROBE_PLUGIN_DIR }],
      settingSources: [],
      maxTurns: 2,
    },
  });
  await session.applyFlagSettings({ effortLevel: null });
  release();

  let modelId = '';
  let claudeCodeVersion = '';
  let text = '';
  for await (const m of session) {
    if (m.type === 'system' && m.subtype === 'init') {
      modelId = m.model;
      claudeCodeVersion = m.claude_code_version;
    }
    if (m.type === 'assistant') for (const block of m.message.content) if (block.type === 'text') text += block.text;
    if (m.type === 'result') break;
  }

  const effort = /EFFORT=(\w+)/.exec(text)?.[1] as EffortLevel | undefined;
  if (!effort || !EFFORTS.includes(effort)) throw new Error(`effort probe answered "${text}"`);
  return { alias: ROLE_MODEL_ALIAS, modelId, effort, claudeCodeVersion };
}
