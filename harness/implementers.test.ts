import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { maxConcurrent, readImplementerTimeline, summarizeImplementers } from './implementers.ts';

const T0 = Date.parse('2026-10-24T10:00:00.000Z');
const at = (seconds: number) => new Date(T0 + seconds * 1000).toISOString();

/** A transcript as the SDK writes it: timestamped assistant and user messages, and `system` task lines without a timestamp. */
function transcript(lines: object[]): string {
  const path = join(mkdtempSync(join(tmpdir(), 'uro-testbed-implementers-')), 'transcript.jsonl');
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return path;
}

const call = (id: string, seconds: number) => ({ type: 'assistant', timestamp: at(seconds), message: { content: [{ type: 'tool_use', id, name: 'Agent' }] } });
const result = (id: string, seconds: number) => ({ type: 'user', timestamp: at(seconds), message: { content: [{ type: 'tool_result', tool_use_id: id }] } });
const started = (task: string, id: string, type: string, description = task) => ({ type: 'system', subtype: 'task_started', task_id: task, tool_use_id: id, subagent_type: type, description });
const done = (task: string, seconds: number, tokens: number) => ({ type: 'system', subtype: 'task_notification', task_id: task, usage: { duration_ms: seconds * 1000, total_tokens: tokens } });

describe('implementer timeline', () => {
  // Foundational alone, then a wave of two stories, then Polish; a reviewer runs between and is not counted. The wave runs
  // in the background, as 0.25.0's does: each call's tool result arrives at launch, and only the notification tells its end.
  const path = transcript([
    call('c1', 0), started('t1', 'c1', 'uroboros:uroboros-implementer-medium', 'Foundational'), done('t1', 60, 1000), result('c1', 60),
    call('c2', 70), started('t2', 'c2', 'uroboros:uroboros-implementer-medium', 'US1'), result('c2', 70),
    call('c3', 70), started('t3', 'c3', 'uroboros:uroboros-implementer-medium', 'US2'), result('c3', 70),
    done('t2', 100, 2000), done('t3', 130, 3000),
    call('r1', 210), started('t4', 'r1', 'uroboros:uroboros-reviewer-medium'), done('t4', 50, 9999), result('r1', 260),
    call('c4', 270), started('t5', 'c4', 'uroboros:uroboros-implementer-medium', 'Polish'), done('t5', 30, 500), result('c4', 300),
    { type: 'assistant', timestamp: at(600), message: { content: [{ type: 'text', text: 'Loop Report' }] } },
    { type: 'result', subtype: 'success' },
  ]);

  it('reads each implementer from its call to the end its notification reports, and only implementers', () => {
    const timeline = readImplementerTimeline(path);
    assert.equal(timeline.dispatches, 4);
    assert.deepEqual(timeline.spans.map((s) => [s.description, (s.start - T0) / 1000, (s.end - T0) / 1000, s.tokens]), [
      ['Foundational', 0, 60, 1000],
      ['US1', 70, 170, 2000],
      ['US2', 70, 200, 3000],
      ['Polish', 270, 300, 500],
    ]);
    assert.equal(timeline.sessionEnd, T0 + 600_000);
  });

  it('summarizes dispatches, concurrency, minutes, tokens and the implement wall-clock', () => {
    assert.deepEqual(summarizeImplementers(readImplementerTimeline(path)), {
      dispatches: 4,
      maxConcurrent: 2,
      implementerSumMs: (60 + 100 + 130 + 30) * 1000,
      implementerTokens: 6500,
      implementersSpanMs: 300_000,
      implementMs: 600_000,
    });
  });

  it('falls back on the tool result when no notification reports a duration', () => {
    const timeline = readImplementerTimeline(transcript([call('c1', 0), started('t1', 'c1', 'uroboros:uroboros-implementer-high'), result('c1', 90)]));
    assert.deepEqual(timeline.spans.map((s) => s.end - s.start), [90_000]);
  });

  it('has nothing to say about a session with no implementer, or no transcript', () => {
    assert.deepEqual(summarizeImplementers(readImplementerTimeline(transcript([call('r1', 0), started('t1', 'r1', 'uroboros:uroboros-reviewer-high'), result('r1', 5)]))), {
      dispatches: 0,
      maxConcurrent: 0,
      implementerSumMs: 0,
      implementerTokens: 0,
      implementersSpanMs: undefined,
      implementMs: undefined,
    });
    assert.equal(readImplementerTimeline(join(tmpdir(), 'no-such-transcript.jsonl')).dispatches, 0);
  });

  it('does not count a span that ends when the next one starts as running beside it', () => {
    const span = (start: number, end: number) => ({ description: '', start, end, tokens: 0 });
    assert.equal(maxConcurrent([span(0, 10), span(10, 20)]), 1);
    assert.equal(maxConcurrent([span(0, 10), span(5, 20), span(6, 7)]), 3);
    assert.equal(maxConcurrent([]), 0);
  });
});
