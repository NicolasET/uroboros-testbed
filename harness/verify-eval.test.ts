import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { FIXTURE_DIR } from './config.ts';
import { buildCase, readCases, scoreRun, type VerifyCase } from './verify-eval.ts';
import { runGate, runHiddenTests } from './verify.ts';

const OWNER = 'u_seller_ana';

function caseWorkspace(c: VerifyCase): string {
  const dir = mkdtempSync(join(tmpdir(), `uro-testbed-verify-${c.name}-`));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  buildCase(dir, c);
  return dir;
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, () => {
      const address = probe.address();
      probe.close(() => (typeof address === 'object' && address ? resolve(address.port) : reject(new Error('no port'))));
    });
  });
}

interface Observed {
  pauseStatus: number;
  pausedById: unknown;
  lampInSearchAfterPause: boolean;
}

/** On the running server: search, pause l_lamp as its owner, fetch it by id, search again. */
async function probe(workspace: string): Promise<Observed> {
  const port = await freePort();
  const { NODE_TEST_CONTEXT: _inherited, ...env } = process.env;
  const server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], { cwd: workspace, env: { ...env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server did not start within 20 s')), 20_000);
      server.stdout.on('data', (chunk: Buffer) => chunk.toString().includes('listings-api on') && (clearTimeout(timer), resolve()));
      server.on('exit', (code) => reject(new Error(`server exited with ${code}`)));
    });
    const base = `http://127.0.0.1:${port}`;
    const ids = async () => ((await (await fetch(`${base}/listings`)).json()) as { id: string }[]).map((l) => l.id);
    await ids();
    const pause = await fetch(`${base}/listings/l_lamp/pause`, { method: 'POST', headers: { 'x-user-id': OWNER } });
    const byId = (await (await fetch(`${base}/listings/l_lamp`)).json()) as { status?: unknown };
    return { pauseStatus: pause.status, pausedById: byId.status, lampInSearchAfterPause: (await ids()).includes('l_lamp') };
  } finally {
    server.kill();
  }
}

const caseNamed = (name: string) => readCases().find((c) => c.name === name)!;

describe('verifier eval cases', () => {
  for (const c of readCases()) {
    it(`${c.name}: in-process hidden tests pass 11/11 with a green gate`, async () => {
      const workspace = caseWorkspace(c);
      assert.equal((await runHiddenTests(workspace)).passed, 11);
      assert.deepEqual(await runGate(workspace), { test: true, typecheck: true, lint: true });
    });
  }

  it('clean: the running server pauses, keeps the status and hides the listing from search', async () => {
    assert.deepEqual(await probe(caseWorkspace(caseNamed('clean'))), { pauseStatus: 200, pausedById: 'paused', lampInSearchAfterPause: false });
  });

  it('route: the running server does not publish pause', async () => {
    assert.equal((await probe(caseWorkspace(caseNamed('route')))).pauseStatus, 404);
  });

  it('cache: the running server still lists the paused listing in search', async () => {
    const observed = await probe(caseWorkspace(caseNamed('cache')));
    assert.deepEqual(observed, { pauseStatus: 200, pausedById: 'paused', lampInSearchAfterPause: true });
  });

  it('status: the running server drops the paused status', async () => {
    const observed = await probe(caseWorkspace(caseNamed('status')));
    assert.deepEqual(observed, { pauseStatus: 200, pausedById: undefined, lampInSearchAfterPause: false });
  });
});

describe('verifier eval scoring', () => {
  const report = (lines: string[]) => ['VERIFIER-REPORT', 'mode: sdd', 'results:', ...lines].join('\n');

  it('a fail on an expected id is a catch; one elsewhere is a stray failure', () => {
    const text = report(['  - id: QS-1', '    outcome: fail', '  - id: QS-3; US1/AC2', '    outcome: fail', '  - id: QS-9', '    outcome: pass', '  - id: QS-5', '    outcome: not-run']);
    assert.deepEqual(scoreRun(text, caseNamed('cache')), { reported: true, caught: true, strayFails: 1, notRun: 1 });
  });

  it('every fail on the clean copy is a stray failure', () => {
    assert.deepEqual(scoreRun(report(['  - id: QS-2', '    outcome: fail']), caseNamed('clean')), { reported: true, caught: undefined, strayFails: 1, notRun: 0 });
  });

  it('no report scores as not reported', () => {
    assert.deepEqual(scoreRun(undefined, caseNamed('route')), { reported: false, strayFails: 0, notRun: 0 });
  });
});
