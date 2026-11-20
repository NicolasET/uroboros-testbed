// Hidden tests of the `small` mode. Never shown to uroboros: copied in after the run, like the other hidden tests.
// They start the real server (`src/server.ts`, what `npm start` runs) and read the line it prints.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { describe, it } from 'node:test';

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

/** What the server printed up to its first full line, or all it printed within 20 s. */
async function startupOutput(port: number): Promise<string> {
  const server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  try {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 20_000);
      const done = (): void => {
        clearTimeout(timer);
        resolve();
      };
      server.stdout?.on('data', (chunk: Buffer) => {
        output += chunk.toString();
        if (output.includes('\n')) done();
      });
      server.on('exit', done);
    });
  } finally {
    server.kill();
  }
  return output;
}

describe('small: the startup message', () => {
  it('says the new text with the real port', async () => {
    const port = await freePort();
    assert.ok((await startupOutput(port)).includes(`API de publicaciones lista en http://localhost:${port}`));
  });

  it('no longer says the old text', async () => {
    const output = await startupOutput(await freePort());
    assert.ok(output.length > 0, 'the server printed nothing');
    assert.ok(!output.includes('listings-api on'));
  });
});
