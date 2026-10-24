import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ImplementRun } from './implement-eval.ts';
import { cell, implementSection, median } from './implement-report.ts';
import type { ModeResult } from './results.ts';

const run = (implementMs: number | undefined, extra: Partial<ImplementRun> = {}): ImplementRun => ({
  dispatches: 1,
  maxConcurrent: 1,
  implementerSumMs: 120_000,
  implementerTokens: 50_000,
  implementersSpanMs: 120_000,
  implementMs,
  costUsd: 2,
  durationMs: 600_000,
  tokens: { input: 1, output: 2, cacheRead: 3, cacheCreation: 4 },
  questionsAsked: 0,
  gateGreen: true,
  everyTaskChecked: true,
  hidden: { passed: 14, total: 14, groups: {} },
  ...extra,
});

const mode = (variants: Array<{ name: string; runs: ImplementRun[] }>): ModeResult => ({
  mode: 'implement',
  startedAt: 'x',
  durationMs: 0,
  costUsd: 0,
  harnessCostUsd: 0,
  tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
  models: [],
  questionsAsked: 0,
  e2e: { pass: true, checks: {} },
  implementEval: { version: 1, variants: variants.map((v) => ({ ...v, flags: [] })) },
});

describe('implement eval report', () => {
  it('takes the median of an odd or even number of runs', () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([4, 1, 3, 2]), 2.5);
  });

  it('shows the median then every run, a single run alone, and nothing when no run has the measure', () => {
    const minutes = (ms: number) => (ms / 60000).toFixed(1);
    const pick = (r: ImplementRun) => r.implementMs;
    assert.equal(cell([run(540_000), run(600_000), run(480_000)], pick, minutes), '9.0 (9.0 · 10.0 · 8.0)');
    assert.equal(cell([run(540_000)], pick, minutes), '9.0');
    assert.equal(cell([run(undefined)], pick, minutes), '-');
  });

  it('puts the previous version\'s variants first, then this run\'s, and lists the waves each run recorded', () => {
    const previous = mode([{ name: 'single', runs: [run(600_000)] }]);
    const current = mode([
      { name: 'default', runs: [run(600_000, { waves: '- none — one dispatch got every task' })] },
      { name: 'parallel=3', runs: [run(480_000, { maxConcurrent: 3, dispatches: 5, waves: '- wave 1: US1, US2, US3' })] },
    ]);
    const lines = implementSection(current, previous);
    assert.equal(lines[2], '| | previous: single | default | parallel=3 |');
    assert.ok(lines.includes('| implementers at once (max) | 1 | 1 | 3 |'));
    assert.ok(lines.includes('| `### Waves` in loop-state.md | absent | none | planned |'));
    assert.ok(lines.includes('- parallel=3 1: - wave 1: US1, US2, US3'));
  });
});
