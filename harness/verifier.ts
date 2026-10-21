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

const SCENARIO_ID = /\b(?:QS-\d+|US\d+\/AC\d+|AC-\d+)\b/g;

/** Counts the `outcome:` lines of one VERIFIER-REPORT block. */
export function parseVerifierReport(text: string): VerifierRound {
  const count = (outcome: string) => (text.match(new RegExp(`^\\s*outcome:\\s*${outcome}\\b`, 'gm')) ?? []).length;
  return { pass: count('pass'), fail: count('fail'), notRun: count('not-run') };
}

/** Each result of one VERIFIER-REPORT: the ids on its `- id:` line and the `outcome:` that follows. */
export function parseVerifierResults(text: string): VerifierResult[] {
  const results: VerifierResult[] = [];
  let ids: string[] | undefined;
  for (const line of text.split(/\r?\n/)) {
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
