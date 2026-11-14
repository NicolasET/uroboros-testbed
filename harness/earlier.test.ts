import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { EARLIER_FEATURE } from './config.ts';
import { countKeptOnIdk } from './earlier.ts';

function workspace(): string {
  return mkdtempSync(join(tmpdir(), 'uro-testbed-earlier-'));
}

function writeState(dir: string, feature: string, lines: string[]): void {
  mkdirSync(join(dir, 'specs', feature), { recursive: true });
  writeFileSync(join(dir, 'specs', feature, 'loop-state.md'), lines.join('\n'));
}

describe('items kept on "I don\'t know"', () => {
  it('counts every marked item in the feature\'s loop-state.md', () => {
    const dir = workspace();
    writeState(dir, '001-pause', ['- D7 Two sellers pausing at once: left out — "No sé" (kept on "I don\'t know")', '- D8 A pause during an order: left out — kept on “I don’t know”', '- D9 Something else: DEFERRED']);
    assert.equal(countKeptOnIdk('default', dir), 2);
    assert.equal(countKeptOnIdk('goal', dir), 0);
  });

  it('counts a decision once however often the log repeats it (0.23.1 goal: one D11 for two items, on two lines)', () => {
    const dir = workspace();
    writeState(dir, '001-pause', ['- D11 Undecided behaviors found by verification: "No sé" → kept as built (kept on "I don\'t know").', '- Open P9 and P10: asked → user "No sé" → kept as built (D11, kept on "I don\'t know").']);
    assert.equal(countKeptOnIdk('default', dir), 1);
  });

  it("reads the run's feature, never the seeded earlier feature that sorts first", () => {
    const dir = workspace();
    writeState(dir, EARLIER_FEATURE, ['- D1 Something: kept on "I don\'t know"', '- D2 Other: kept on "I don\'t know"']);
    writeState(dir, '001-pause', ['- D7 One case: kept on "I don\'t know"']);
    assert.equal(countKeptOnIdk('default', dir), 1);
  });
});
