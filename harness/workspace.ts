import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FIXTURE_DIR, type Mode } from './config.ts';
import { execOrThrow } from './exec.ts';

/**
 * A fresh copy of the fixture (with its installed dependencies) as a git repo with one commit.
 * It lives in the OS temp directory, outside this repository, so nothing uroboros explores
 * around its working directory can reach `scenario/` (the truth and the hidden tests).
 */
export async function createWorkspace(mode: Mode): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), `uro-testbed-${mode}-`));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  await execOrThrow('git', ['init', '--quiet', '--initial-branch', 'main'], dir);
  await execOrThrow('git', ['config', 'user.email', 'testbed@uroboros.local'], dir);
  await execOrThrow('git', ['config', 'user.name', 'uroboros testbed'], dir);
  await execOrThrow('git', ['add', '-A'], dir);
  await execOrThrow('git', ['commit', '--quiet', '-m', 'fixture'], dir);
  return dir;
}
