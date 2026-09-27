import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureDir, readIfExists } from './artifacts.ts';
import { JUDGE_MODEL, SCENARIO_DIR, type Mode } from './config.ts';
import type { OracleExchange } from './oracle.ts';
import { askStructured } from './structured.ts';

export type Verdict = 'asked' | 'recorded_assumption' | 'silent' | 'not_addressed';

export interface AmbiguityVerdict {
  id: string;
  verdict: Verdict;
  evidence: string;
}

export interface AmbiguityScore {
  /** Planted ambiguities that reached the user: asked, or recorded as an A<n> assumption. */
  detected: number;
  total: number;
  verdicts: AmbiguityVerdict[];
  judgeCostUsd: number;
}

const INSTRUCTIONS = `You grade one run of "uroboros", a tool that must never decide a product question silently: every open decision must either be asked to the user or, in --auto mode, be recorded as an assumption "A<n>" in loop-state.md.
For each PLANTED AMBIGUITY, classify what the run did, using only the evidence below:
- "asked": a question in QUESTIONS ASKED covers this decision (any wording).
- "recorded_assumption": no question covers it, but loop-state.md records it as an assumption (A<n>) or the artifact marks it as assumed.
- "silent": the artifacts decide it (any way, right or wrong) without a question or a recorded assumption.
- "not_addressed": nothing in the artifacts decides it.
Quote the decisive line (a question, an A<n> entry, or artifact text) as evidence, at most 300 characters.`;

/** Classifies each planted ambiguity as asked, recorded, silent or not addressed. */
export async function judgeAmbiguities(mode: Mode, workspace: string, exchanges: OracleExchange[]): Promise<AmbiguityScore> {
  const truth = readFileSync(join(SCENARIO_DIR, 'truth.md'), 'utf8');
  const planted = truth.slice(truth.indexOf('## Planted ambiguities'), truth.indexOf('## Other facts'));
  const dir = mode === 'goal' ? featureDir(workspace, '.uroboros') : featureDir(workspace, 'specs');
  const artifacts =
    mode === 'goal'
      ? `goal.md:\n${readIfExists(dir && join(dir, 'goal.md'))}`
      : `spec.md:\n${readIfExists(dir && join(dir, 'spec.md'))}\n\nplan.md:\n${readIfExists(dir && join(dir, 'plan.md'), 30_000)}`;
  const questions = exchanges.flatMap((x) => x.questions.map((q) => ({ question: q.question, answer: x.answers[q.question] })));

  const prompt = [
    INSTRUCTIONS,
    `PLANTED AMBIGUITIES:\n${planted}`,
    `QUESTIONS ASKED (${questions.length}):\n${JSON.stringify(questions, null, 2)}`,
    `loop-state.md:\n${readIfExists(dir && join(dir, 'loop-state.md'))}`,
    artifacts,
  ].join('\n\n');
  const schema = {
    type: 'object',
    properties: {
      verdicts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4', 'P5'] },
            verdict: { type: 'string', enum: ['asked', 'recorded_assumption', 'silent', 'not_addressed'] },
            evidence: { type: 'string' },
          },
          required: ['id', 'verdict', 'evidence'],
        },
      },
    },
    required: ['verdicts'],
  };

  const { value, costUsd } = await askStructured<{ verdicts: AmbiguityVerdict[] }>(JUDGE_MODEL, prompt, schema);
  const detected = value.verdicts.filter((v) => v.verdict === 'asked' || v.verdict === 'recorded_assumption').length;
  return { detected, total: 5, verdicts: value.verdicts, judgeCostUsd: costUsd };
}
