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
  /** Pausing a listing id that does not exist, as a signed-in seller: status and error code (FR-006). */
  unknownPause: string;
}

/** On the running server: search, pause l_lamp as its owner, fetch it by id, search again, pause an unknown id. */
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
    const lampInSearchAfterPause = (await ids()).includes('l_lamp');
    const unknown = await fetch(`${base}/listings/l_nope/pause`, { method: 'POST', headers: { 'x-user-id': OWNER } });
    const unknownPause = `${unknown.status} ${((await unknown.json()) as { error?: string }).error}`;
    return { pauseStatus: pause.status, pausedById: byId.status, lampInSearchAfterPause, unknownPause };
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
    const clean = { pauseStatus: 200, pausedById: 'paused', lampInSearchAfterPause: false, unknownPause: '404 listing_not_found' };
    assert.deepEqual(await probe(caseWorkspace(caseNamed('clean'))), clean);
  });

  it('edge: the running server refuses an unknown id with 403, not FR-006\'s 404; every scenario holds', async () => {
    const observed = await probe(caseWorkspace(caseNamed('edge')));
    assert.deepEqual(observed, { pauseStatus: 200, pausedById: 'paused', lampInSearchAfterPause: false, unknownPause: '403 not_listing_owner' });
  });

  it('route: the running server does not publish pause', async () => {
    assert.equal((await probe(caseWorkspace(caseNamed('route')))).pauseStatus, 404);
  });

  it('cache: the running server still lists the paused listing in search', async () => {
    const observed = await probe(caseWorkspace(caseNamed('cache')));
    assert.deepEqual(observed, { pauseStatus: 200, pausedById: 'paused', lampInSearchAfterPause: true, unknownPause: '404 listing_not_found' });
  });

  it('status: the running server drops the paused status', async () => {
    const observed = await probe(caseWorkspace(caseNamed('status')));
    assert.deepEqual(observed, { pauseStatus: 200, pausedById: undefined, lampInSearchAfterPause: false, unknownPause: '404 listing_not_found' });
  });
});

describe('verifier eval scoring', () => {
  const report = (lines: string[]) => ['VERIFIER-REPORT', 'mode: sdd', 'results:', ...lines].join('\n');

  it('a fail on an expected id is a catch; one elsewhere is a stray failure', () => {
    const text = report(['  - id: QS-1', '    outcome: fail', '  - id: QS-3; US1/AC2', '    outcome: fail', '  - id: QS-9', '    outcome: pass', '  - id: QS-5', '    outcome: not-run']);
    assert.deepEqual(scoreRun(text, caseNamed('cache')), { reported: true, caught: true, strayFails: 1, notRun: 1, probeFails: 0, open: 0 });
  });

  it('every fail on the clean copy is a stray failure', () => {
    assert.deepEqual(scoreRun(report(['  - id: QS-2', '    outcome: fail']), caseNamed('clean')), { reported: true, caught: undefined, strayFails: 1, notRun: 0, probeFails: 0, open: 0 });
  });

  const probes = (lines: string[]) => report(['  - id: QS-1', '    outcome: pass', 'probes:', ...lines, 'open:', '  - id: P9', '    behavior: 400', 'observed:', '  - none']);

  it('a probe fail naming the broken requirement is a catch; probes never count as scenarios', () => {
    const text = probes(['  - id: P1', '    source: FR-006 — spec.md:38', '    outcome: fail', '  - id: P2', '    source: FR-001', '    outcome: pass']);
    assert.deepEqual(scoreRun(text, caseNamed('edge')), { reported: true, caught: true, strayFails: 0, notRun: 0, probeFails: 1, open: 1 });
  });

  it('a probe fail on another requirement is no catch', () => {
    const text = probes(['  - id: P1', '    source: FR-0060', '    outcome: fail']);
    assert.equal(scoreRun(text, caseNamed('edge')).caught, false);
  });

  it('a probe fail on the clean copy is a stray failure', () => {
    const text = probes(['  - id: P1', '    source: FR-002', '    outcome: fail']);
    assert.deepEqual(scoreRun(text, caseNamed('clean')), { reported: true, caught: undefined, strayFails: 1, notRun: 0, probeFails: 1, open: 1 });
  });

  it('no report scores as not reported', () => {
    assert.deepEqual(scoreRun(undefined, caseNamed('route')), { reported: false, strayFails: 0, notRun: 0 });
  });
});
