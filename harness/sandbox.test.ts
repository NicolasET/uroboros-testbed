import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { killsHarness, outsidePath, shellPaths, type Fence } from './sandbox.ts';

const work = 'C:/uro-testbed-work';
const workspace = join(work, 'review-abc');
const plugin = join(work, 'plugins', 'uroboros-v0.16.1');
const testbed = 'C:/Users/me/uroboros-testbed';
const fence: Fence = { allowed: [workspace, plugin, `${workspace}-tmp`], sensitive: [testbed, work, 'C:/Users/me'], cwd: workspace };

describe('sandbox fence', () => {
  it('lets file tools work in the workspace, the plugin and the session temp directory', () => {
    assert.equal(outsidePath('Read', { file_path: join(workspace, 'src', 'app.ts') }, fence), undefined);
    assert.equal(outsidePath('Read', { file_path: 'src/app.ts' }, fence), undefined);
    assert.equal(outsidePath('Read', { file_path: join(plugin, 'references', 'reviewer-instructions.md') }, fence), undefined);
    assert.equal(outsidePath('Write', { file_path: join(`${workspace}-tmp`, 'x.txt') }, fence), undefined);
    assert.equal(outsidePath('Glob', { pattern: '**/*.ts' }, fence), undefined);
    assert.equal(outsidePath('Grep', { pattern: 'rank', glob: '*.ts' }, fence), undefined);
  });

  it('denies the reads the 0.16.1 reviewer made: the testbed, the workspaces root, another workspace', () => {
    assert.ok(outsidePath('Glob', { pattern: '**/ranking.ts*', path: testbed }, fence));
    assert.ok(outsidePath('Read', { file_path: join(testbed, 'fixture', 'src', 'ranking.ts') }, fence));
    assert.ok(outsidePath('Glob', { pattern: '*/src/listings.ts', path: work }, fence));
    assert.ok(outsidePath('Read', { file_path: join(work, 'review-xyz', 'src', 'ranking.ts') }, fence));
    assert.ok(outsidePath('Glob', { pattern: '../**/ranking.ts' }, fence));
    assert.ok(outsidePath('Glob', { pattern: `${testbed}/scenario/truth.md` }, fence));
  });

  it('denies a shell command that names the testbed or another workspace, and allows the rest', () => {
    assert.ok(outsidePath('Bash', { command: `cat ${testbed}/scenario/truth.md` }, fence));
    assert.ok(outsidePath('Bash', { command: 'cd c:/uro-testbed-work && mkdir -p qs-tmp' }, fence));
    assert.ok(outsidePath('Bash', { command: 'ls /c/uro-testbed-work/review-xyz' }, fence));
    assert.ok(outsidePath('PowerShell', { command: 'Get-Content C:\\Users\\me\\uroboros-testbed\\fixture\\src\\app.ts' }, fence));
    assert.ok(outsidePath('Bash', { command: 'npm test' }, fence, join(testbed, 'fixture')));
    assert.equal(outsidePath('Bash', { command: 'npm test 2>/dev/null && git status' }, fence), undefined);
    assert.equal(outsidePath('Bash', { command: `git -C ${workspace} diff --stat` }, fence), undefined);
    assert.equal(outsidePath('Bash', { command: 'curl -s http://localhost:3000/listings' }, fence), undefined);
  });

  it('reads Windows, Git Bash and POSIX paths out of a command', () => {
    assert.deepEqual(shellPaths('cat C:\\a\\b.txt /c/d/e.txt /tmp/f "x"'), ['C:\\a\\b.txt', 'c:/d/e.txt', '/tmp/f']);
  });
});

describe('killing the harness by process name', () => {
  const bash = (command: string) => killsHarness('Bash', { command });
  it('denies what kills every Node process: the 0.30.1 verifier\'s taskkill, pkill, Stop-Process', () => {
    assert.ok(bash('taskkill //F //IM node.exe >/dev/null 2>&1; sleep 1; (PORT=3000 npm start &)'));
    assert.ok(bash('taskkill /F /IM node.exe'));
    assert.ok(bash('taskkill /im "node.exe" /t'));
    assert.ok(bash('pkill node'));
    assert.ok(bash('pkill -f -9 tsx'));
    assert.ok(bash('killall node'));
    assert.ok(killsHarness('PowerShell', { command: 'Stop-Process -Name node -Force' }));
    assert.ok(killsHarness('PowerShell', { command: 'Get-Process | Stop-Process -Force -Name "node"' }));
  });
  it('lets a session stop what it started, and other tools pass', () => {
    assert.equal(bash('kill $SERVER_PID'), false);
    assert.equal(bash('taskkill /F /PID 4120'), false);
    assert.equal(bash('kill %1; npx kill-port 3000'), false);
    assert.equal(bash('pkill -f "src/server.ts"'), false);
    assert.equal(bash('node --version'), false);
    assert.equal(killsHarness('PowerShell', { command: 'Stop-Process -Id $server.Id' }), false);
    assert.equal(killsHarness('Read', { file_path: 'taskkill /IM node.exe' }), false);
  });
});
