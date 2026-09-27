import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { UROBOROS_REPO_URL } from './config.ts';
import { exec, execOrThrow } from './exec.ts';

export interface UroborosSource {
  /** Plugin root loaded into every session. */
  dir: string;
  /** What was asked for: a path or a git ref. */
  requested: string;
  version: string;
  commit: string;
  /** Uncommitted changes in a local checkout. */
  dirty: boolean;
  /** Results directory name: the version when the code is exactly its release tag, else version+commit. */
  label: string;
}

/** Resolves a local checkout, or clones the published repo at a tag or branch. */
export async function resolveUroboros(requested: string, workRoot: string): Promise<UroborosSource> {
  let dir: string;
  if (existsSync(requested)) {
    dir = resolve(requested);
  } else {
    dir = join(workRoot, `uroboros-${requested.replace(/[^\w.-]/g, '_')}`);
    await execOrThrow('git', ['clone', '--quiet', '--depth', '1', '--branch', requested, UROBOROS_REPO_URL, dir], workRoot);
  }

  const manifest = JSON.parse(readFileSync(join(dir, '.claude-plugin', 'plugin.json'), 'utf8')) as { version: string };
  const commit = await execOrThrow('git', ['rev-parse', 'HEAD'], dir);
  const dirty = (await execOrThrow('git', ['status', '--porcelain'], dir)).length > 0;
  const tag = await exec('git', ['describe', '--exact-match', '--tags', 'HEAD'], dir);
  const atReleaseTag = tag.code === 0 && tag.output.trim() === `v${manifest.version}`;
  const label = atReleaseTag && !dirty ? manifest.version : `${manifest.version}+${commit.slice(0, 7)}${dirty ? '.dirty' : ''}`;

  return { dir, requested, version: manifest.version, commit, dirty, label };
}
