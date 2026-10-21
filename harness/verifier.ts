import { subagentReports } from './transcript.ts';

export interface VerifierRound {
  pass: number;
  fail: number;
  notRun: number;
}

export interface VerifierScore {
  /** One entry per VERIFIER-REPORT the session received (uroboros 0.16.0+), in order. */
  rounds: VerifierRound[];
  /** A report failed a scenario and a later report found every scenario passing or not run. */
  caught: boolean;
}

export interface VerifierResult {
  /** The scenario ids of one result (`QS-3`, `US1/AC2`, `AC-1`); a result may name several. */
  ids: string[];
  outcome: string;
}

export interface VerifierProbe {
  id: string;
  /** The requirement or edge case the probe was derived from, with its location (`FR-006 — spec.md:41`). */
  source: string;
  outcome: string;
}

const SCENARIO_ID = /\b(?:QS-\d+|US\d+\/AC\d+|AC-\d+)\b/g;

/**
 * The lines of one top-level block of a VERIFIER-REPORT (`results:`, `probes:`, `open:`), up to the next top-level key.
 * From uroboros 0.20.0 the report carries `probes:` and `open:` after `results:`; only `results:` holds scenarios.
 */
export function reportBlock(text: string, key: string): string[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimEnd() === `${key}:` || line.startsWith(`${key}: `));
  if (start < 0) return [];
  const end = lines.findIndex((line, i) => i > start && /^[a-z_]+:/.test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end);
}

/** Counts the scenario outcomes (`results:`) of one VERIFIER-REPORT block. */
export function parseVerifierReport(text: string): VerifierRound {
  const outcomes = reportBlock(text, 'results').map((line) => /^\s*outcome:\s*(pass|fail|not-run)\b/.exec(line)?.[1]);
  const count = (outcome: string) => outcomes.filter((o) => o === outcome).length;
  return { pass: count('pass'), fail: count('fail'), notRun: count('not-run') };
}

/** Each probe of one VERIFIER-REPORT (`probes:`, uroboros 0.20.0+): its id, `source:` and `outcome:`. */
export function parseVerifierProbes(text: string): VerifierProbe[] {
  const probes: VerifierProbe[] = [];
  let current: VerifierProbe | undefined;
  for (const line of reportBlock(text, 'probes')) {
    const id = /^\s*-\s*id:\s*(.+)$/.exec(line);
    if (id?.[1]) {
      current = { id: id[1].trim(), source: '', outcome: '' };
      probes.push(current);
      continue;
    }
    const field = /^\s*(source|outcome):\s*(.+)$/.exec(line);
    if (field?.[1] && field[2] && current) current[field[1] as 'source' | 'outcome'] = field[2].trim();
  }
  return probes;
}

/** How many behaviors one VERIFIER-REPORT left `open:` (uroboros 0.20.0+): outcomes the spec does not fix. */
export function countOpen(text: string): number {
  return reportBlock(text, 'open').filter((line) => /^\s*-\s*id:/.test(line)).length;
}

/** Each result of one VERIFIER-REPORT: the ids on its `- id:` line and the `outcome:` that follows. */
export function parseVerifierResults(text: string): VerifierResult[] {
  const results: VerifierResult[] = [];
  let ids: string[] | undefined;
  for (const line of reportBlock(text, 'results')) {
    const id = /^\s*-\s*id:\s*(.+)$/.exec(line);
    if (id?.[1]) {
      ids = id[1].match(SCENARIO_ID) ?? [];
      continue;
    }
    const outcome = /^\s*outcome:\s*(\S+)/.exec(line);
    if (outcome?.[1] && ids) {
      results.push({ ids, outcome: outcome[1] });
      ids = undefined;
    }
  }
  return results;
}

/** The verifier's reports in a session's transcript, in order. */
export function verifierReports(transcriptPath: string): string[] {
  return subagentReports(transcriptPath, 'VERIFIER-REPORT');
}

/** Scores the verifier rounds of a pipeline run from its transcript; undefined when no verifier ran. */
export function scoreVerifier(transcriptPath: string): VerifierScore | undefined {
  const rounds = verifierReports(transcriptPath).map(parseVerifierReport);
  if (!rounds.length) return undefined;
  const firstFail = rounds.findIndex((r) => r.fail > 0);
  const last = rounds[rounds.length - 1]!;
  return { rounds, caught: firstFail >= 0 && firstFail < rounds.length - 1 && last.fail === 0 };
}
