import { cpSync, existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { FIXTURE_DIR, WORKSPACES_ROOT, type Mode } from './config.ts';
import { execOrThrow } from './exec.ts';

const INSTRUCTION_FILES = ['CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md', '.claude'];

/**
 * Refuses a workspaces root whose ancestors could inject instructions into a session: the user's home
 * (its ~/.claude/CLAUDE.md loads as a project file below it) or any CLAUDE.md, AGENTS.md or .claude above it.
 * Outside this repository too, so nothing uroboros explores can reach `scenario/`.
 */
export function assertIsolatedRoot(root = resolve(WORKSPACES_ROOT)): void {
  const insideHome = !relative(homedir(), root).startsWith('..');
  if (insideHome) throw new Error(`workspaces root ${root} is inside ${homedir()}; set UROBOROS_TESTBED_WORKDIR to a directory outside it`);
  for (let dir = dirname(root); ; dir = dirname(dir)) {
    const found = INSTRUCTION_FILES.map((f) => join(dir, f)).find((p) => existsSync(p));
    if (found) throw new Error(`${found} sits above the workspaces root and would load into every session`);
    if (dirname(dir) === dir) break;
  }
}

/** A fresh copy of the fixture (with its installed dependencies) as a git repo with one commit. */
export async function createWorkspace(mode: Mode): Promise<string> {
  mkdirSync(WORKSPACES_ROOT, { recursive: true });
  const dir = mkdtempSync(join(WORKSPACES_ROOT, `${mode}-`));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  await execOrThrow('git', ['init', '--quiet', '--initial-branch', 'main'], dir);
  await execOrThrow('git', ['config', 'user.email', 'testbed@uroboros.local'], dir);
  await execOrThrow('git', ['config', 'user.name', 'uroboros testbed'], dir);
  await execOrThrow('git', ['add', '-A'], dir);
  await execOrThrow('git', ['commit', '--quiet', '-m', 'fixture'], dir);
  return dir;
}
