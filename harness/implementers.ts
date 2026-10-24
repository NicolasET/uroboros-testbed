// When each `uroboros-implementer-*` subagent of a session ran, read from its transcript. A subagent's `task_started`
// names its type and the Agent call that launched it (`tool_use_id`); `system` lines carry no timestamp, so the start is
// the timestamp of the assistant message holding that call, and the end is the start plus the `duration_ms` its
// `task_notification` reports — or, without one, the timestamp of the call's tool result. The duration comes first:
// the implementers of a wave run in the background, and their tool result arrives when they are launched.
import { existsSync, readFileSync } from 'node:fs';

export interface ImplementerSpan {
  description: string;
  /** Epoch milliseconds. */
  start: number;
  end: number;
  tokens: number;
}

export interface ImplementerTimeline {
  /** Every implementer dispatch, whether or not its timing could be read. */
  dispatches: number;
  spans: ImplementerSpan[];
  /** The last timestamped line: the session's last turn. */
  sessionEnd?: number;
}

export interface ImplementerSummary {
  dispatches: number;
  /** The most implementers running at the same moment. */
  maxConcurrent: number;
  /** Every implementer's own running time, added up. */
  implementerSumMs: number;
  implementerTokens: number;
  /** First implementer start → last implementer end. */
  implementersSpanMs?: number;
  /** First implementer start → the session's last turn: implement and all that follows it (review, convergence, verification, Loop Report). */
  implementMs?: number;
}

const IMPLEMENTER = /uroboros-implementer-/;

interface Line {
  type?: string;
  subtype?: string;
  timestamp?: string;
  task_id?: string;
  tool_use_id?: string;
  subagent_type?: string;
  description?: string;
  usage?: { duration_ms?: number; total_tokens?: number };
  message?: { content?: unknown };
}

function blocks(m: Line): Array<{ type?: string; id?: string; tool_use_id?: string }> {
  const content = m.message?.content;
  return Array.isArray(content) ? content : [];
}

export function readImplementerTimeline(transcriptPath: string): ImplementerTimeline {
  if (!existsSync(transcriptPath)) return { dispatches: 0, spans: [] };
  const lines = readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Line);
  const calledAt = new Map<string, number>();
  const resultAt = new Map<string, number>();
  const usage = new Map<string, NonNullable<Line['usage']>>();
  let sessionEnd: number | undefined;
  for (const m of lines) {
    const at = m.timestamp ? Date.parse(m.timestamp) : undefined;
    if (at !== undefined) sessionEnd = Math.max(sessionEnd ?? at, at);
    if (at !== undefined && m.type === 'assistant') for (const b of blocks(m)) if (b.type === 'tool_use' && b.id) calledAt.set(b.id, at);
    if (at !== undefined && m.type === 'user') for (const b of blocks(m)) if (b.type === 'tool_result' && b.tool_use_id) resultAt.set(b.tool_use_id, at);
    if (m.type === 'system' && m.subtype === 'task_notification' && m.task_id && m.usage) usage.set(m.task_id, m.usage);
  }
  const started = lines.filter((m) => m.type === 'system' && m.subtype === 'task_started' && IMPLEMENTER.test(m.subagent_type ?? ''));
  const spans: ImplementerSpan[] = [];
  for (const s of started) {
    const start = s.tool_use_id ? calledAt.get(s.tool_use_id) : undefined;
    const u = s.task_id ? usage.get(s.task_id) : undefined;
    const end = start !== undefined && u?.duration_ms !== undefined ? start + u.duration_ms : s.tool_use_id ? resultAt.get(s.tool_use_id) : undefined;
    if (start !== undefined && end !== undefined) spans.push({ description: s.description ?? '', start, end, tokens: u?.total_tokens ?? 0 });
  }
  return { dispatches: started.length, spans, sessionEnd };
}

/** The most spans open at one moment; a span that ends exactly when another starts does not overlap it. */
export function maxConcurrent(spans: ImplementerSpan[]): number {
  const events = spans.flatMap((s) => [{ at: s.start, delta: 1 }, { at: s.end, delta: -1 }]).sort((a, b) => a.at - b.at || a.delta - b.delta);
  let open = 0;
  let max = 0;
  for (const e of events) max = Math.max(max, (open += e.delta));
  return max;
}

export function summarizeImplementers(timeline: ImplementerTimeline): ImplementerSummary {
  const { spans } = timeline;
  const first = spans.length ? Math.min(...spans.map((s) => s.start)) : undefined;
  const last = spans.length ? Math.max(...spans.map((s) => s.end)) : undefined;
  return {
    dispatches: timeline.dispatches,
    maxConcurrent: maxConcurrent(spans),
    implementerSumMs: spans.reduce((n, s) => n + (s.end - s.start), 0),
    implementerTokens: spans.reduce((n, s) => n + s.tokens, 0),
    implementersSpanMs: first !== undefined && last !== undefined ? last - first : undefined,
    implementMs: first !== undefined && timeline.sessionEnd !== undefined ? Math.max(timeline.sessionEnd, last ?? 0) - first : undefined,
  };
}
