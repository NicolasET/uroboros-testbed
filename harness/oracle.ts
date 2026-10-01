import { appendFileSync } from 'node:fs';
import { ORACLE_MODEL, type Mode } from './config.ts';
import { askStructured } from './structured.ts';

export interface AskedQuestion {
  question: string;
  header?: string;
  multiSelect?: boolean;
  options: { label: string; description?: string }[];
}

export interface OracleExchange {
  at: string;
  mode: Mode;
  questions: AskedQuestion[];
  answers: Record<string, string>;
}

const RULES = `You are role-playing the user of a software project who asked for a feature. You know ONLY the facts in TRUTH below.
Answer each question exactly as that user would:
- Answer in the language of the question.
- If one of the offered options states what the truth says, answer with that option's label, copied exactly.
- If the truth settles the question but no option says it, answer with one short sentence that states the truth.
- If the truth leaves the decision to the implementer's judgement and an option delegates it (e.g. "elige tú"), answer with that option's label; with no such option, answer that you leave it to them. Never pick an option that keeps such a decision open or undecided (e.g. "No lo sé", "Sigue abierto"): the truth has decided it — it is theirs to choose.
- If the truth does not settle the question, answer "No sé" (or "I don't know" if the question is in English). Never invent a fact, and never pick an option just to be helpful.
- Asked whether you have references, mockups, example code or libraries to point at: you have none.
- Asked to approve or confirm a summary, a prompt or a draft: check every statement in it against the truth, including what it lists as open or undecided. If it contradicts the truth, or leaves open something the truth settles, answer with free text that starts with the label of the option for correcting it — whatever it is called, any option other than the approving one — followed by ": " and every correction in one or two sentences each (e.g. "Algo no cuadra: …" or "Algo no está bien: …"). A bare label without the corrections is never enough. Otherwise answer with the label of the approving option.
- For a multiSelect question, list every matching label separated by ", ". If no label matches, answer with one short sentence that says what you mean instead.
- Never return an empty answer.
- Speak as the user, in the first person. Never mention TRUTH, a document, or that you are role-playing.
Return "answers" as a list with exactly one answer per question, in the same order as QUESTIONS.`;

/** Answers uroboros's questions from the scenario truth, and logs every exchange. */
export class Oracle {
  costUsd = 0;
  asked = 0;

  constructor(
    private readonly truth: string,
    private readonly logPath: string,
  ) {}

  async answer(mode: Mode, questions: AskedQuestion[]): Promise<Record<string, string>> {
    this.asked += questions.length;
    const numbered = questions.map((q, i) => ({ number: i + 1, ...q }));
    const prompt = `${RULES}\n\nTRUTH:\n${this.truth}\n\nQUESTIONS (JSON):\n${JSON.stringify(numbered, null, 2)}`;
    // Answers come back by position, never keyed by question text: models rewrite long keys.
    const schema = {
      type: 'object',
      properties: { answers: { type: 'array', items: { type: 'string' }, minItems: questions.length, maxItems: questions.length } },
      required: ['answers'],
    };
    const { value, costUsd } = await askStructured<{ answers: string[] }>(ORACLE_MODEL, prompt, schema);
    this.costUsd += costUsd;
    if (value.answers.length !== questions.length) {
      throw new Error(`oracle returned ${value.answers.length} answers for ${questions.length} questions`);
    }

    const answers: Record<string, string> = {};
    questions.forEach((q, i) => (answers[q.question] = value.answers[i]!));
    const exchange: OracleExchange = { at: new Date().toISOString(), mode, questions, answers };
    appendFileSync(this.logPath, JSON.stringify(exchange) + '\n');
    return answers;
  }
}
