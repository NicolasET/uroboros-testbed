import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { STANDING_DECISIONS_SEED } from './config.ts';
import { checkDecisionsFile, countKeptOnIdk } from './standing.ts';

const seed = readFileSync(STANDING_DECISIONS_SEED, 'utf8');
const entry = (id: string): string => seed.split('\n').find((l) => l.startsWith(`- ${id} `))!;
const [s1, s2, s3] = [entry('S1'), entry('S2'), entry('S3')];

function workspace(decisions?: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'uro-testbed-standing-'));
  if (decisions !== undefined) {
    mkdirSync(join(dir, '.uroboros'));
    writeFileSync(join(dir, '.uroboros', 'decisions.md'), decisions);
  }
  return dir;
}

const expected = [
  '# Standing decisions',
  '',
  "- S1 Only admins change a listing's status, except that the seller who owns a listing may pause and resume it. (from 001-pause, D3, 2026-10-23)",
  s2,
  '- S4 Repeating a status change that is already in effect succeeds and changes nothing. (from 001-pause, D5, 2026-10-23)',
  '',
  '## Retired',
  '',
  `${s3} — retired in 001-pause, 2026-10-23`,
].join('\n');

describe('decisions.md at the end', () => {
  it('passes the end state truth.md asks for', () => {
    assert.deepEqual(checkDecisionsFile('default', workspace(expected)), {
      pass: true,
      checks: {
        'S1 changed: the owner seller may pause and resume': true,
        'S2 kept as it is': true,
        'no other entry restates S2': true,
        'S3 retired': true,
        'decisions listed at the end added': true,
      },
    });
  });

  it('accepts S1 retired and replaced by a new entry, in Spanish', () => {
    const text = expected
      .replace(/^- S1 .*$/m, '- S5 Solo los admins cambian el status, salvo que el vendedor dueño puede pausarla y reanudarla. (from 001-pause, D3, 2026-10-23)')
      .replace('## Retired\n', `## Retired\n\n${s1} — retired in 001-pause, 2026-10-23`);
    assert.equal(checkDecisionsFile('goal', workspace(text)).pass, true);
  });

  it('fails a file the run left as it was', () => {
    const { checks } = checkDecisionsFile('default', workspace(seed));
    assert.equal(checks['S1 changed: the owner seller may pause and resume'], false);
    assert.equal(checks['S2 kept as it is'], true);
    assert.equal(checks['S3 retired'], false);
    assert.equal(checks['decisions listed at the end added'], false);
  });

  it('fails a second entry about error codes', () => {
    const text = expected.replace(s2, `${s2}\n- S6 Los códigos de error exactos los elige la implementación, en snake_case. (from 001-pause, D7, 2026-10-23)`);
    assert.equal(checkDecisionsFile('default', workspace(text)).checks['no other entry restates S2'], false);
  });

  it('fails a missing file', () => {
    assert.equal(checkDecisionsFile('default', workspace()).pass, false);
  });

  it('under --auto, passes only an untouched file, whatever its line endings', () => {
    assert.equal(checkDecisionsFile('auto', workspace(seed.replace(/\n/g, '\r\n'))).pass, true);
    assert.equal(checkDecisionsFile('auto', workspace(expected)).pass, false);
  });
});

describe('items kept on "I don\'t know"', () => {
  it('counts every marked item in the feature\'s loop-state.md', () => {
    const dir = workspace();
    mkdirSync(join(dir, 'specs', '001-pause'), { recursive: true });
    const state = ['- D7 Two sellers pausing at once: left out — "No sé" (kept on "I don\'t know")', '- D8 A pause during an order: left out — kept on “I don’t know”', '- D9 Something else: DEFERRED'];
    writeFileSync(join(dir, 'specs', '001-pause', 'loop-state.md'), state.join('\n'));
    assert.equal(countKeptOnIdk('default', dir), 2);
    assert.equal(countKeptOnIdk('goal', dir), 0);
  });
});
