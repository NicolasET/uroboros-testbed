// Hidden runtime tests. Never shown to uroboros: copied in after the run, like the acceptance tests.
// They start the real server (`src/server.ts`, what `npm start` runs) instead of the in-process app the
// fixture's own tests use, so a feature that works in-process but is not reachable on the running server fails.
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';

const OWNER = 'u_seller_ana'; // owns l_lamp

let server: ChildProcess;
let base = '';

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

before(async () => {
  const port = await freePort();
  server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start within 20 s')), 20_000);
    server.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('listings-api on')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on('exit', (code) => reject(new Error(`server exited with ${code}`)));
  });
  base = `http://127.0.0.1:${port}`;
});
after(() => {
  server?.kill();
});

const is2xx = (status: number) => status >= 200 && status < 300;
async function request(method: string, path: string, as?: string): Promise<{ status: number; body: any }> {
  const res = await fetch(base + path, { method, headers: as ? { 'x-user-id': as } : {} });
  return { status: res.status, body: await res.json() };
}

describe('runtime: through the running server', () => {
  it('the owner pauses a listing and it becomes paused', async () => {
    assert.ok(is2xx((await request('POST', '/listings/l_lamp/pause', OWNER)).status));
    assert.equal((await request('GET', '/listings/l_lamp')).body.status, 'paused');
  });

  it('a paused listing is left out of search', async () => {
    const ids = (await request('GET', '/listings')).body.map((l: { id: string }) => l.id);
    assert.ok(!ids.includes('l_lamp'));
  });

  it('the owner resumes it and it becomes active', async () => {
    assert.ok(is2xx((await request('POST', '/listings/l_lamp/resume', OWNER)).status));
    assert.equal((await request('GET', '/listings/l_lamp')).body.status, 'active');
  });
});
