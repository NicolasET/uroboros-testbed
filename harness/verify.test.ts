import assert from 'node:assert/strict';
import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { FIXTURE_DIR, ROOT } from './config.ts';
import { parseTap, runGate, runHiddenTests } from './verify.ts';

function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'uro-testbed-verify-'));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  return dir;
}

describe('hidden acceptance tests', () => {
  it('all fail on the bare fixture, so none passes without the feature', async () => {
    const result = await runHiddenTests(copyFixture());
    assert.equal(result.total, 11);
    assert.equal(result.passed, 0);
    assert.deepEqual(Object.keys(result.groups).map((g) => g.split(':')[0]), ['core', 'P1', 'P2', 'P3', 'P4', 'P5']);
  });

  it('all pass on the reference implementation, with a green gate', async () => {
    const workspace = copyFixture();
    cpSync(join(ROOT, 'harness', 'reference', 'src'), join(workspace, 'src'), { recursive: true });
    const hidden = await runHiddenTests(workspace);
    assert.equal(hidden.passed, 11, JSON.stringify(hidden.groups));
    assert.deepEqual(await runGate(workspace), { test: true, typecheck: true, lint: true });
  });
});

describe('parseTap', () => {
  it('reports the raw output when nothing ran', () => {
    const result = parseTap('SyntaxError: boom');
    assert.equal(result.total, 0);
    assert.match(result.error ?? '', /boom/);
  });
});
