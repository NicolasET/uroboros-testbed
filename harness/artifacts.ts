import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EARLIER_FEATURE, type Mode } from './config.ts';
import { atLeast, SINGLE_FLOW_FROM } from './versions.ts';

/** Where a run of this mode and uroboros version keeps its feature: `specs/` for the spec-kit pipeline, `.uroboros/` for goal mode and, from 1.0.0, for every run. */
export const featureRoot = (mode: Mode, version: string): 'specs' | '.uroboros' => (mode === 'goal' || atLeast(version, SINGLE_FLOW_FROM) ? '.uroboros' : 'specs');

/** The feature directory a run produced: `specs/<feature>/` (pipeline) or `.uroboros/<slug>/` (goal) — never the seeded earlier feature. */
export function featureDir(workspace: string, root: 'specs' | '.uroboros'): string | undefined {
  const base = join(workspace, root);
  if (!existsSync(base)) return undefined;
  const dirs = readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== EARLIER_FEATURE);
  return dirs.length ? join(base, dirs[0]!.name) : undefined;
}

export function readIfExists(path: string | undefined, maxChars = 60_000): string {
  if (!path || !existsSync(path)) return '';
  const text = readFileSync(path, 'utf8');
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n[… truncated at ${maxChars} characters]` : text;
}
