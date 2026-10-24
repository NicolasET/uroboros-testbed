// The implement eval's part of summary.md: one column per variant — the previous version's first — and in each cell the
// median of the variant's runs followed by every run, so the spread shows next to the number compared.
import type { ImplementRun } from './implement-eval.ts';
import type { ModeResult } from './results.ts';

type Measure = [name: string, pick: (r: ImplementRun) => number | undefined, show: (n: number) => string];

const minutes = (ms: number) => (ms / 60000).toFixed(1);

const MEASURES: Measure[] = [
  ['implement: first implementer → session end (min)', (r) => r.implementMs, minutes],
  ['implementers: first start → last end (min)', (r) => r.implementersSpanMs, minutes],
  ['implementer minutes, added up', (r) => r.implementerSumMs, minutes],
  ['implementer dispatches', (r) => r.dispatches, String],
  ['implementers at once (max)', (r) => r.maxConcurrent, String],
  ['implementer tokens', (r) => r.implementerTokens, String],
  ['session cost (USD, estimate)', (r) => r.costUsd, (n) => n.toFixed(2)],
  ['session duration (min)', (r) => r.durationMs, minutes],
  ['session output tokens', (r) => r.tokens.output, String],
  ['questions asked', (r) => r.questionsAsked, String],
];

const PER_RUN: Array<[name: string, show: (r: ImplementRun) => string]> = [
  ['hidden tests', (r) => `${r.hidden.passed}/${r.hidden.total}`],
  ['gate green', (r) => (r.gateGreen ? '✓' : '✗')],
  ['every task checked', (r) => (r.everyTaskChecked ? '✓' : '✗')],
  ['`### Waves` in loop-state.md', (r) => (r.waves === undefined ? 'absent' : /^[-*\s]*none\b/i.test(r.waves) ? 'none' : 'planned')],
];

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** The median of the runs that have the measure, then each of those runs; a single run is shown alone. */
export function cell(runs: ImplementRun[], pick: Measure[1], show: Measure[2]): string {
  const values = runs.map(pick).filter((v): v is number => v !== undefined);
  if (!values.length) return '-';
  return values.length === 1 ? show(values[0]!) : `${show(median(values))} (${values.map(show).join(' · ')})`;
}

export function implementSection(current: ModeResult, previous?: ModeResult): string[] {
  const columns = [
    ...(previous?.implementEval?.variants ?? []).map((v) => ({ title: `previous: ${v.name}`, runs: v.runs })),
    ...(current.implementEval?.variants ?? []).map((v) => ({ title: v.name, runs: v.runs })),
  ];
  const failed = Object.entries(current.e2e.checks).filter(([, ok]) => !ok).map(([k]) => k);
  const lines = [
    `End to end: ${failed.length ? `FAIL (${failed.join('; ')})` : 'pass'}. Each cell: the median, then every run.`,
    '',
    `| | ${columns.map((c) => c.title).join(' | ')} |`,
    `|---|${columns.map(() => '---|').join('')}`,
  ];
  for (const [name, pick, show] of MEASURES) lines.push(`| ${name} | ${columns.map((c) => cell(c.runs, pick, show)).join(' | ')} |`);
  for (const [name, show] of PER_RUN) lines.push(`| ${name} | ${columns.map((c) => c.runs.map(show).join(' · ') || '-').join(' | ')} |`);
  const waves = (current.implementEval?.variants ?? []).flatMap((v) => v.runs.map((r, i) => [`${v.name} ${i + 1}`, r.waves] as const)).filter(([, w]) => w);
  if (waves.length) {
    lines.push('', 'Waves recorded:', '');
    for (const [run, w] of waves) lines.push(`- ${run}: ${w!.replace(/\s+/g, ' ').slice(0, 400)}`);
  }
  return lines;
}
