import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureDir, readIfExists } from './artifacts.ts';
import { JUDGE_MODEL, SCENARIO_DIR, STANDING_DECISIONS_MODES, STANDING_DECISIONS_SEED, type Mode } from './config.ts';
import type { OracleExchange } from './oracle.ts';
import type { ContradictionScore } from './standing.ts';
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

export interface JudgeResult {
  ambiguity: AmbiguityScore;
  /** Modes seeded with the standing decisions only. */
  contradictions?: ContradictionScore;
  /** Headers of the questions that asked the user to settle a whole list at once and were answered "I don't know". */
  idkLists: string[];
}

/** The standing decisions the idea contradicts (truth.md, Standing decisions). */
const CONTRADICTED = ['S1', 'S3'];

const INSTRUCTIONS = `You grade one run of "uroboros", a tool that must never decide a product question silently: every open decision must either be asked to the user or, in --auto mode, be recorded as an assumption "A<n>" in loop-state.md.
For each PLANTED AMBIGUITY, classify what the run did, using only the evidence below:
- "asked": a question in QUESTIONS ASKED covers this decision (any wording).
- "recorded_assumption": no question covers it, but loop-state.md records it as an assumption (A<n>) or the artifact marks it as assumed.
- "silent": the artifacts decide it (any way, right or wrong) without a question or a recorded assumption.
- "not_addressed": nothing in the artifacts decides it.
A question about a standing decision (an S<n> entry of the project's .uroboros/decisions.md) covers a planted ambiguity only as far as its options or its answer settle that ambiguity.
Quote the decisive line (a question, an A<n> entry, or artifact text) as evidence, at most 300 characters.`;

const STANDING_INSTRUCTIONS = `For each CONTRADICTED STANDING DECISION — an entry of the project's .uroboros/decisions.md that the idea contradicts — classify on the same scale whether the contradiction reached the user:
- "asked": a question asked whether to keep it, set it aside for this feature, or change it (any wording).
- "recorded_assumption": no question covers it, but loop-state.md records an assumption (A<n>) that settles it.
- "silent": the artifacts keep it or override it without a question or a recorded assumption.
- "not_addressed": nothing in the artifacts addresses it.`;

const IDK_LIST_INSTRUCTIONS = `Finally, list in "idkLists" the number of every question in QUESTIONS ASKED that asked the user to settle a whole list at once — minor cases to leave out or decide, values to keep as written or change, or behaviors of the built product to keep as built — and whose answer says "I don't know" ("No sé", in any wording). An empty list when there is none.`;

/**
 * Classifies each planted ambiguity — and, where the workspace held the standing decisions, each one the idea
 * contradicts — as asked, recorded, silent or not addressed, and finds the lists answered "I don't know".
 */
export async function judgeRun(mode: Mode, workspace: string, exchanges: OracleExchange[]): Promise<JudgeResult> {
  const truth = readFileSync(join(SCENARIO_DIR, 'truth.md'), 'utf8');
  const planted = truth.slice(truth.indexOf('## Planted ambiguities'), truth.indexOf('## Other facts'));
  const seeded = STANDING_DECISIONS_MODES.includes(mode);
  const dir = mode === 'goal' ? featureDir(workspace, '.uroboros') : featureDir(workspace, 'specs');
  const artifacts =
    mode === 'goal'
      ? `goal.md:\n${readIfExists(dir && join(dir, 'goal.md'))}`
      : `spec.md:\n${readIfExists(dir && join(dir, 'spec.md'))}\n\nplan.md:\n${readIfExists(dir && join(dir, 'plan.md'), 30_000)}`;
  const questions = exchanges.flatMap((x) =>
    x.questions.map((q) => ({ header: q.header, question: q.question, options: q.options.map((o) => o.label), answer: x.answers[q.question] })),
  );
  const numbered = questions.map((q, i) => ({ number: i + 1, ...q }));

  const prompt = [
    INSTRUCTIONS,
    ...(seeded ? [STANDING_INSTRUCTIONS] : []),
    IDK_LIST_INSTRUCTIONS,
    `PLANTED AMBIGUITIES:\n${planted}`,
    ...(seeded ? [`STANDING DECISIONS (the idea contradicts ${CONTRADICTED.join(' and ')}):\n${readFileSync(STANDING_DECISIONS_SEED, 'utf8')}`] : []),
    `QUESTIONS ASKED (${questions.length}):\n${JSON.stringify(numbered, null, 2)}`,
    `loop-state.md:\n${readIfExists(dir && join(dir, 'loop-state.md'))}`,
    artifacts,
  ].join('\n\n');
  const verdictList = (ids: string[]) => ({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', enum: ids },
        verdict: { type: 'string', enum: ['asked', 'recorded_assumption', 'silent', 'not_addressed'] },
        evidence: { type: 'string' },
      },
      required: ['id', 'verdict', 'evidence'],
    },
  });
  const schema = {
    type: 'object',
    properties: {
      verdicts: verdictList(['P1', 'P2', 'P3', 'P4', 'P5']),
      ...(seeded ? { standing: verdictList(CONTRADICTED) } : {}),
      idkLists: { type: 'array', items: { type: 'integer' } },
    },
    required: ['verdicts', 'idkLists', ...(seeded ? ['standing'] : [])],
  };

  const { value, costUsd } = await askStructured<{ verdicts: AmbiguityVerdict[]; standing?: AmbiguityVerdict[]; idkLists: number[] }>(JUDGE_MODEL, prompt, schema);
  const reached = (vs: AmbiguityVerdict[]) => vs.filter((v) => v.verdict === 'asked' || v.verdict === 'recorded_assumption').length;
  return {
    ambiguity: { detected: reached(value.verdicts), total: 5, verdicts: value.verdicts, judgeCostUsd: costUsd },
    contradictions: value.standing && { surfaced: reached(value.standing), total: CONTRADICTED.length, verdicts: value.standing },
    idkLists: value.idkLists.map((n) => questions[n - 1]?.header ?? `question ${n}`),
  };
}
