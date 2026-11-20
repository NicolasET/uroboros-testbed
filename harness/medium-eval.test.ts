import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { FIXTURE_DIR } from './config.ts';
import { MEDIUM_DIR, MEDIUM_HIDDEN_TESTS } from './small-eval.ts';
import { runGate, runHiddenTestFile } from './verify.ts';

function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'uro-testbed-medium-'));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  return dir;
}

/** The filter the idea asks for, written into the fixture's search: the reference this eval's hidden tests pass on. */
function addMaxPrice(source: string): string {
  const validated = source.replace(
    '  const results = [...store.listings.values()]',
    "  const raw = url.searchParams.get('maxPrice');\n  const max = raw === null ? undefined : Number(raw);\n  if (max !== undefined && (!Number.isInteger(max) || max <= 0)) return sendError(res, 400, 'invalid_max_price');\n  const results = [...store.listings.values()]",
  );
  return validated.replace('.filter((l) => l.title.toLowerCase().includes(q))', '.filter((l) => l.title.toLowerCase().includes(q) && (max === undefined || l.priceCents <= max))');
}

describe('medium eval', () => {
  it('its hidden tests fail on the bare fixture, so none passes without the filter', async () => {
    const result = await runHiddenTestFile(copyFixture(), MEDIUM_HIDDEN_TESTS);
    assert.equal(result.total, 4, result.error ?? '');
    assert.equal(result.passed, 0);
  });

  it('they pass once the search has the filter, with a green gate', async () => {
    const workspace = copyFixture();
    const listings = join(workspace, 'src', 'listings.ts');
    const before = readFileSync(listings, 'utf8');
    const after = addMaxPrice(before);
    assert.ok(after.includes('invalid_max_price') && after.includes('l.priceCents <= max'), 'the fixture search no longer has the lines this reference edits');
    writeFileSync(listings, after);
    const hidden = await runHiddenTestFile(workspace, MEDIUM_HIDDEN_TESTS);
    assert.equal(hidden.passed, 4, JSON.stringify(hidden.groups));
    assert.deepEqual(await runGate(workspace), { test: true, typecheck: true, lint: true });
  });

  it('the idea names the parameter the hidden tests send', () => {
    assert.ok(readFileSync(join(MEDIUM_DIR, 'idea.md'), 'utf8').includes('maxPrice'));
  });
});
