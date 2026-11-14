import { join } from 'node:path';
import { featureDir, readIfExists } from './artifacts.ts';
import type { Mode } from './config.ts';
import type { AmbiguityVerdict } from './judge.ts';

export interface ChangedScore {
  /** Earlier decisions the idea changes that reached the user: asked, or recorded as an A<n> assumption. */
  surfaced: number;
  total: number;
  verdicts: AmbiguityVerdict[];
}

export interface KeptVerdict {
  /** True when a question asked the user to decide again what an earlier decision the idea leaves alone already settled. */
  reasked: boolean;
  evidence: string;
}

/** Scenario v9+: how the run handled the earlier feature's decisions, and the lists the user could not answer. */
export interface EarlierScore {
  /** From the judge; absent when it failed. */
  changed?: ChangedScore;
  /** From the judge; absent when it failed. */
  kept?: KeptVerdict;
  /** Lists answered "I don't know" (their headers, from the judge; absent when it failed) and the items loop-state.md kept on that answer. */
  idk?: { lists: string[]; kept: number };
}

/**
 * Decisions loop-state.md records as kept on "I don't know" (Question protocol, uroboros 0.23.0+): each distinct `D<n>`
 * on a marked line once, however often the log repeats it, plus each marked line that names none.
 */
export function countKeptOnIdk(mode: Mode, workspace: string): number {
  const dir = mode === 'goal' ? featureDir(workspace, '.uroboros') : featureDir(workspace, 'specs');
  const state = readIfExists(dir && join(dir, 'loop-state.md'), Number.MAX_SAFE_INTEGER);
  const marked = state.split('\n').filter((line) => /kept on\s*["“”']?I don['’]?t know/i.test(line));
  const ids = new Set(marked.flatMap((line) => line.match(/\bD\d+\b/g) ?? []));
  return ids.size + marked.filter((line) => !/\bD\d+\b/.test(line)).length;
}
