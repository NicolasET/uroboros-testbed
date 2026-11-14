import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureDir, readIfExists } from './artifacts.ts';
import { EARLIER_CHANGED, EARLIER_FEATURE, EARLIER_FEATURE_MODES, EARLIER_FEATURE_SEED, EARLIER_KEPT, JUDGE_MODEL, SCENARIO_DIR, type Mode } from './config.ts';
import type { ChangedScore, KeptVerdict } from './earlier.ts';
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

export interface JudgeResult {
  ambiguity: AmbiguityScore;
  /** Modes seeded with the earlier feature only: its decisions the idea changes. */
  changed?: ChangedScore;
  /** Modes seeded with the earlier feature only: whether a decision the idea leaves alone was asked again. */
  kept?: KeptVerdict;
  /** Headers of the questions that asked the user to settle a whole list at once and were answered "I don't know". */
  idkLists: string[];
}

const INSTRUCTIONS = `You grade one run of "uroboros", a tool that must never decide a product question silently: every open decision must either be asked to the user or, in --auto mode, be recorded as an assumption "A<n>" in loop-state.md.
For each PLANTED AMBIGUITY, classify what the run did, using only the evidence below:
- "asked": a question in QUESTIONS ASKED covers this decision (any wording).
- "recorded_assumption": no question covers it, but loop-state.md records it as an assumption (A<n>) or the artifact marks it as assumed.
- "silent": the artifacts decide it (any way, right or wrong) without a question or a recorded assumption.
- "not_addressed": nothing in the artifacts decides it.
A question about an earlier feature's decision covers a planted ambiguity only as far as its options or its answer settle that ambiguity. An assumption (A<n>) the earlier feature recorded settles nothing: a planted ambiguity the run treats as decided by it is "silent".
Quote the decisive line (a question, an A<n> entry, or artifact text) as evidence, at most 300 characters.`;

const CHANGED_INSTRUCTIONS = `The workspace held an EARLIER FEATURE, ${EARLIER_FEATURE}, whose decisions the user made in an earlier run. For each EARLIER DECISION THE IDEA CHANGES, classify on the same scale whether the change reached the user:
- "asked": a question asked whether that earlier decision still holds, or asked the user to decide that point anew (any wording).
- "recorded_assumption": no question covers it, but loop-state.md records an assumption (A<n>) that settles it.
- "silent": the artifacts keep it or override it without a question or a recorded assumption.
- "not_addressed": nothing in the artifacts addresses it.`;

const KEPT_INSTRUCTIONS = `In "kept", say whether any question in QUESTIONS ASKED asked the user to decide again what an EARLIER DECISION THE IDEA LEAVES ALONE already settles — which error style refusals use, or which exact error codes or success bodies to return. "reasked": true when one did (quote it as evidence), false when none did (evidence: "none"). A question that only confirms, in a list of values, what the artifact already says does not count.`;

const IDK_LIST_INSTRUCTIONS = `Finally, list in "idkLists" the number of every question in QUESTIONS ASKED that asked the user to settle a whole list at once — minor cases to leave out or decide, values to keep as written or change, or behaviors of the built product to keep as built — and whose answer says "I don't know" ("No sé", in any wording). An empty list when there is none.`;

/**
 * Classifies each planted ambiguity — and, where the workspace held the earlier feature, each of its decisions the
 * idea changes — as asked, recorded, silent or not addressed, checks whether a decision the idea leaves alone was
 * asked again, and finds the lists answered "I don't know".
 */
export async function judgeRun(mode: Mode, workspace: string, exchanges: OracleExchange[]): Promise<JudgeResult> {
  const truth = readFileSync(join(SCENARIO_DIR, 'truth.md'), 'utf8');
  const planted = truth.slice(truth.indexOf('## Planted ambiguities'), truth.indexOf('## Other facts'));
  const seeded = EARLIER_FEATURE_MODES.includes(mode);
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
    ...(seeded ? [CHANGED_INSTRUCTIONS, KEPT_INSTRUCTIONS] : []),
    IDK_LIST_INSTRUCTIONS,
    `PLANTED AMBIGUITIES:\n${planted}`,
    ...(seeded
      ? [
          `EARLIER DECISIONS THE IDEA CHANGES: ${EARLIER_CHANGED.join(', ')}. EARLIER DECISIONS THE IDEA LEAVES ALONE: ${EARLIER_KEPT.join(', ')}.`,
          `EARLIER FEATURE loop-state.md:\n${readFileSync(join(EARLIER_FEATURE_SEED, 'loop-state.md'), 'utf8')}`,
        ]
      : []),
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
      ...(seeded
        ? {
            changed: verdictList([...EARLIER_CHANGED]),
            kept: { type: 'object', properties: { reasked: { type: 'boolean' }, evidence: { type: 'string' } }, required: ['reasked', 'evidence'] },
          }
        : {}),
      idkLists: { type: 'array', items: { type: 'integer' } },
    },
    required: ['verdicts', 'idkLists', ...(seeded ? ['changed', 'kept'] : [])],
  };

  const { value, costUsd } = await askStructured<{ verdicts: AmbiguityVerdict[]; changed?: AmbiguityVerdict[]; kept?: KeptVerdict; idkLists: number[] }>(JUDGE_MODEL, prompt, schema);
  const reached = (vs: AmbiguityVerdict[]) => vs.filter((v) => v.verdict === 'asked' || v.verdict === 'recorded_assumption').length;
  return {
    ambiguity: { detected: reached(value.verdicts), total: 5, verdicts: value.verdicts, judgeCostUsd: costUsd },
    changed: value.changed && { surfaced: reached(value.changed), total: EARLIER_CHANGED.length, verdicts: value.changed },
    kept: value.kept,
    idkLists: value.idkLists.map((n) => questions[n - 1]?.header ?? `question ${n}`),
  };
}
