import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';

/** One tool-less, isolated call to a pinned model that must return JSON matching `schema`. */
export async function askStructured<T>(model: string, prompt: string, schema: Record<string, unknown>): Promise<{ value: T; costUsd: number }> {
  const cwd = mkdtempSync(join(tmpdir(), 'uro-testbed-llm-'));
  let value: unknown;
  let costUsd = 0;
  for await (const m of query({
    prompt,
    options: {
      cwd,
      model,
      tools: [],
      settingSources: [],
      maxTurns: 3,
      outputFormat: { type: 'json_schema', schema },
    },
  })) {
    if (m.type === 'result') {
      costUsd = m.total_cost_usd;
      if (m.subtype !== 'success') throw new Error(`${model} returned ${m.subtype}`);
      value = m.structured_output;
    }
  }
  if (value === undefined) throw new Error(`${model} returned no structured output`);
  return { value: value as T, costUsd };
}
