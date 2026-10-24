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

const RULES = `You are role-playing the user of a software project who asked for a feature. You know ONLY the facts under WHAT YOU KNOW below.
Answer each question exactly as that user would:
- Answer in the language of the question.
- If one of the offered options states what you know, answer with that option's label, copied exactly.
- If what you know settles the question but no option says it, answer with one short sentence that states it.
- If what you know leaves the decision to the implementer's judgement and an option delegates it (e.g. "elige tú"), answer with that option's label; with no such option, answer that you leave it to them. Never pick an option that keeps such a decision open or undecided (e.g. "No lo sé", "Sigue abierto"): you have decided it — it is theirs to choose.
- If what you know does not settle the question, answer "No sé" (or "I don't know" if the question is in English). Never invent a fact, and never pick an option just to be helpful.
- Asked whether you have references, mockups, example code or libraries to point at: you have none.
- Asked to approve or confirm a summary, a prompt or a draft: check every statement in it against what you know, including what it lists as open or undecided. If it contradicts what you know, or leaves open something you know, answer with free text that starts with the label of the option for correcting it — whatever it is called, any option other than the approving one — followed by ": " and every correction in one or two sentences each (e.g. "Algo no cuadra: …" or "Algo no está bien: …"). A bare label without the corrections is never enough. Otherwise answer with the label of the approving option.
- If you choose an option that asks you to write which items and how (e.g. "Change some", "Decide some"), answer with its label followed by ": " and what you want for each item — never the bare label.
- For a multiSelect question, list every matching label separated by ", ". If no label matches, answer with one short sentence that says what you mean instead.
- Never return an empty answer.
- Speak as the user, in the first person. Never mention WHAT YOU KNOW, a document, a file, a score or a test, or that you are role-playing.
Return "answers" as a list with exactly one answer per question, in the same order as QUESTIONS.`;

/** Plain names for truth.md's headings, as the user would put them. */
const HEADINGS: Record<string, string> = { 'Planted ambiguities': 'What I want', 'Other facts': 'Other things I know', 'Standing decisions': "The project's standing decisions" };

/**
 * What the fictional user knows, the way they would know it: truth.md without what it tells the maintainer and the judge —
 * its title and notes, the scoring in its headings, the ids of the planted ambiguities, the file it is. The oracle quoted
 * those words back into its answers ("the five planted ambiguities"), so it never sees them.
 */
export function userView(truth: string): string {
  const body = truth.slice(truth.indexOf('\n## ') + 1).split('\n');
  return body
    .filter((line) => !line || line.startsWith('## ') || line.startsWith('- '))
    .map((line) => {
      if (line.startsWith('## ')) {
        const name = line.slice(3).replace(/ \(.*\)$/, '');
        return `## ${HEADINGS[name] ?? name}`;
      }
      return line
        .replace(/^- \*\*P\d+ — (.+?)(?: \([^)]*\))?\.\*\*/, '- **$1.**')
        .replace('a case this file settles', 'a case I know the answer to')
        .replace(/^- Anything this file does not answer: (.+?) \(the oracle must say so, never invent\)\.$/, '- Anything else: $1 — never invent.');
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Answers uroboros's questions from what the fictional user knows (`userView` of truth.md), and logs every exchange. */
export class Oracle {
  costUsd = 0;
  asked = 0;
  private readonly known: string;

  constructor(
    truth: string,
    private readonly logPath: string,
  ) {
    this.known = userView(truth);
  }

  async answer(mode: Mode, questions: AskedQuestion[]): Promise<Record<string, string>> {
    this.asked += questions.length;
    const numbered = questions.map((q, i) => ({ number: i + 1, ...q }));
    const prompt = `${RULES}\n\nWHAT YOU KNOW:\n${this.known}\n\nQUESTIONS (JSON):\n${JSON.stringify(numbered, null, 2)}`;
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
