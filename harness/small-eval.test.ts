import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { FIXTURE_DIR } from './config.ts';
import { SMALL_DIR, SMALL_HIDDEN_TESTS } from './small-eval.ts';
import { runGate, runHiddenTestFile } from './verify.ts';

const OLD_LINE = 'listings-api on http://localhost:';
const NEW_LINE = 'API de publicaciones lista en http://localhost:';

function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'uro-testbed-small-'));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  return dir;
}

describe('small eval', () => {
  it('its hidden tests fail on the bare fixture, so neither passes without the change', async () => {
    const result = await runHiddenTestFile(copyFixture(), SMALL_HIDDEN_TESTS);
    assert.equal(result.total, 2, result.error ?? '');
    assert.equal(result.passed, 0);
  });

  it('they pass once the startup message is the one the idea asks for, with a green gate', async () => {
    const workspace = copyFixture();
    const server = join(workspace, 'src', 'server.ts');
    const before = readFileSync(server, 'utf8');
    const after = before.replace(OLD_LINE, NEW_LINE);
    assert.notEqual(after, before, 'the fixture no longer prints the line the idea quotes');
    writeFileSync(server, after);
    const hidden = await runHiddenTestFile(workspace, SMALL_HIDDEN_TESTS);
    assert.equal(hidden.passed, 2, JSON.stringify(hidden.groups));
    assert.deepEqual(await runGate(workspace), { test: true, typecheck: true, lint: true });
  });

  it('the idea quotes the line the fixture prints today and the one the hidden tests expect', () => {
    const idea = readFileSync(join(SMALL_DIR, 'idea.md'), 'utf8');
    assert.ok(idea.includes(OLD_LINE));
    assert.ok(idea.includes(NEW_LINE));
    assert.ok(readFileSync(join(FIXTURE_DIR, 'src', 'server.ts'), 'utf8').includes(OLD_LINE));
  });
});
