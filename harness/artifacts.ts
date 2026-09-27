import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The feature directory a run produced: `specs/<feature>/` (pipeline) or `.uroboros/<slug>/` (goal). */
export function featureDir(workspace: string, root: 'specs' | '.uroboros'): string | undefined {
  const base = join(workspace, root);
  if (!existsSync(base)) return undefined;
  const dirs = readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());
  return dirs.length ? join(base, dirs[0]!.name) : undefined;
}

export function readIfExists(path: string | undefined, maxChars = 60_000): string {
  if (!path || !existsSync(path)) return '';
  const text = readFileSync(path, 'utf8');
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n[… truncated at ${maxChars} characters]` : text;
}
