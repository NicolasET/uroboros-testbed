// uroboros's working-tree snapshots (0.17.0+, "Working-tree snapshots" in skills/run/SKILL.md), reproduced for the
// reviewer eval: a git tree of every non-ignored file, untracked ones included, written through a temporary index
// inside .git — no commit, no ref, the real index untouched.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execOrThrow } from './exec.ts';

const gitPath = async (workspace: string, name: string) => resolve(workspace, await execOrThrow('git', ['rev-parse', '--git-path', name], workspace));

/** The tree id of the working tree, as the plugin's snapshot command takes it. */
export async function snapshot(workspace: string): Promise<string> {
  const index = await gitPath(workspace, 'uroboros/snapshot.index');
  mkdirSync(dirname(index), { recursive: true });
  const real = await gitPath(workspace, 'index');
  const env = { GIT_INDEX_FILE: index };
  if (existsSync(real)) copyFileSync(real, index);
  else await execOrThrow('git', ['read-tree', '--empty'], workspace, env);
  await execOrThrow('git', ['add', '-A'], workspace, env);
  return (await execOrThrow('git', ['write-tree'], workspace, env)).split(/\r?\n/).pop()!.trim();
}

/** Writes the run's unified diff where the plugin writes it (`.git/uroboros/run.diff`) and returns that absolute path. */
export async function writeRunDiff(workspace: string, base: string, round: string): Promise<string> {
  const path = await gitPath(workspace, 'uroboros/run.diff');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, await execOrThrow('git', ['diff', base, round], workspace));
  return path;
}
