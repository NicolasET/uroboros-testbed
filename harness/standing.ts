import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureDir, readIfExists } from './artifacts.ts';
import type { EndToEnd } from './checks.ts';
import { STANDING_DECISIONS_SEED, type Mode } from './config.ts';
import type { AmbiguityVerdict } from './judge.ts';

export interface ContradictionScore {
  /** Contradicted standing decisions that reached the user: asked, or recorded as an A<n> assumption. */
  surfaced: number;
  total: number;
  verdicts: AmbiguityVerdict[];
}

/** Scenario v7+: how the run handled the project's standing decisions and the lists the user could not answer. */
export interface StandingScore {
  /** From the judge; absent when it failed. */
  contradictions?: ContradictionScore;
  /** `.uroboros/decisions.md` at the end of the run, against what truth.md answers. */
  file: EndToEnd;
  /** Lists answered "I don't know" (their headers, from the judge; absent when it failed) and the items loop-state.md kept on that answer. */
  idk?: { lists: string[]; kept: number };
  /** From the judge, in the modes that may write the file; absent when it failed. */
  duplicates?: string[];
}

const normalize = (text: string): string => text.replace(/\r\n/g, '\n').trim();
const entries = (text: string): string[] => text.split('\n').filter((l) => l.startsWith('- '));
const OWNER = /seller|owner|vendedor|due[ñn]|propietari/i;
const PAUSE = /paus/i;
const ERROR_CODES = /error codes?|c[oó]digos? de error|snake_case/i;

/**
 * Deterministic checks on `.uroboros/decisions.md`. Under `--auto` the run must not write it. Otherwise truth.md
 * answers: S1 changed so the owner seller may pause and resume (in place, or retired with a new entry), S2 kept
 * with no other entry restating it, S3 retired, and every decision listed at the end added.
 */
export function checkDecisionsFile(mode: Mode, workspace: string): EndToEnd {
  const seed = normalize(readFileSync(STANDING_DECISIONS_SEED, 'utf8'));
  const path = join(workspace, '.uroboros', 'decisions.md');
  const final = existsSync(path) ? normalize(readFileSync(path, 'utf8')) : '';
  if (mode === 'auto') {
    const checks = { 'decisions.md untouched': final === seed };
    return { pass: checks['decisions.md untouched'], checks };
  }

  const seedEntry = (id: string): string => entries(seed).find((l) => l.startsWith(`- ${id} `))!;
  const retiredAt = final.search(/^##\s+Retired\b/m);
  const active = entries(retiredAt < 0 ? final : final.slice(0, retiredAt));
  const retired = retiredAt < 0 ? '' : final.slice(retiredAt);
  const s1 = active.find((l) => /^- S1\b/.test(l));
  const s1ChangedInPlace = !!s1 && s1 !== seedEntry('S1') && OWNER.test(s1) && PAUSE.test(s1);
  const s1Replaced = !s1 && /^- S1\b/m.test(retired) && active.some((l) => OWNER.test(l) && PAUSE.test(l));

  const checks: Record<string, boolean> = {
    'S1 changed: the owner seller may pause and resume': s1ChangedInPlace || s1Replaced,
    'S2 kept as it is': active.includes(seedEntry('S2')),
    'no other entry restates S2': active.filter((l) => ERROR_CODES.test(l)).length === 1,
    'S3 retired': !active.some((l) => /^- S3\b/.test(l)) && /\bS3\b|single status/i.test(retired),
    'decisions listed at the end added': active.some((l) => !/^- S[123]\b/.test(l)),
  };
  return { pass: Object.values(checks).every(Boolean), checks };
}

/** Items loop-state.md records as kept on "I don't know" (Question protocol, uroboros 0.23.0+). */
export function countKeptOnIdk(mode: Mode, workspace: string): number {
  const dir = mode === 'goal' ? featureDir(workspace, '.uroboros') : featureDir(workspace, 'specs');
  const state = readIfExists(dir && join(dir, 'loop-state.md'), Number.MAX_SAFE_INTEGER);
  return state.match(/kept on\s*["“”']?I don['’]?t know/gi)?.length ?? 0;
}
