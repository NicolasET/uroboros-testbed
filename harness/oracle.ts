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
- If the truth does not settle the question, answer "No sé" (or "I don't know" if the question is in English). Never invent a fact, and never pick an option just to be helpful.
- Asked whether you have references, mockups, example code or libraries to point at: you have none.
- Asked to approve or confirm a summary, a prompt or a draft: approve it when nothing in it contradicts the truth; otherwise pick the option that lets you correct it and state the correction.
- For a multiSelect question, list every matching label separated by ", ".
Return every question's exact text as a key of "answers".`;

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
    const prompt = `${RULES}\n\nTRUTH:\n${this.truth}\n\nQUESTIONS (JSON):\n${JSON.stringify(questions, null, 2)}`;
    const schema = {
      type: 'object',
      properties: { answers: { type: 'object', additionalProperties: { type: 'string' } } },
      required: ['answers'],
    };
    const { value, costUsd } = await askStructured<{ answers: Record<string, string> }>(ORACLE_MODEL, prompt, schema);
    this.costUsd += costUsd;

    const answers: Record<string, string> = {};
    for (const q of questions) answers[q.question] = value.answers[q.question] ?? 'No sé';
    const exchange: OracleExchange = { at: new Date().toISOString(), mode, questions, answers };
    appendFileSync(this.logPath, JSON.stringify(exchange) + '\n');
    return answers;
  }
}
