import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESULTS_DIR, type Mode } from './config.ts';
import type { ModeResult, RunResult } from './results.ts';

type Row = [string, (r: ModeResult) => string];

const ROWS: Row[] = [
  ['end to end', (r) => (r.e2e.pass ? 'pass' : `FAIL (${Object.entries(r.e2e.checks).filter(([, ok]) => !ok).map(([k]) => k).join('; ')})`)],
  ['ambiguities detected', (r) => (r.ambiguity ? `${r.ambiguity.detected}/${r.ambiguity.total}` : '-')],
  ['hidden tests', (r) => (r.hidden ? `${r.hidden.passed}/${r.hidden.total}` : '-')],
  ['runtime tests (real server)', (r) => (r.runtime ? `${r.runtime.passed}/${r.runtime.total}` : '-')],
  ['verifier (pass/fail/not-run per round)', (r) => (r.verifier ? `${r.verifier.rounds.map((v) => `${v.pass}/${v.fail}/${v.notRun}`).join(' → ')}${r.verifier.caught ? ' — caught a failure, fixed' : ''}` : '-')],
  ['verifier detection (caught / runs)', (r) => (r.verifierEval ? r.verifierEval.cases.filter((c) => c.expectFail).map((c) => `${c.name} ${c.runs.filter((x) => x.caught).length}/${c.runs.length}`).join(' · ') : '-')],
  ['verifier false failures', (r) => (r.verifierEval ? falseFailures(r) : '-')],
  ['gate (test/typecheck/lint)', (r) => (r.gate ? [r.gate.test, r.gate.typecheck, r.gate.lint].map((ok) => (ok ? '✓' : '✗')).join(' ') : '-')],
  ['questions asked', (r) => String(r.questionsAsked)],
  ['cost (USD, estimate)', (r) => r.costUsd.toFixed(2)],
  ['duration (min)', (r) => (r.durationMs / 60000).toFixed(1)],
  ['output tokens', (r) => String(r.tokens.output)],
];

/** Clean runs that reported any failure, and failures on scenarios the defect does not break, over all runs. */
function falseFailures(r: ModeResult): string {
  const cases = r.verifierEval?.cases ?? [];
  const clean = cases.filter((c) => !c.expectFail).flatMap((c) => c.runs);
  const stray = cases.flatMap((c) => c.runs).reduce((n, x) => n + x.strayFails, 0);
  const notRun = cases.flatMap((c) => c.runs).reduce((n, x) => n + x.notRun, 0);
  return `clean ${clean.filter((x) => x.strayFails > 0).length}/${clean.length} runs · stray fails ${stray} · not-run ${notRun}`;
}

/** The most recent earlier result whose version is lower than this run's, if any. */
export function previousResult(current: RunResult): RunResult | undefined {
  if (!existsSync(RESULTS_DIR)) return undefined;
  const older = readdirSync(RESULTS_DIR)
    .map((name) => join(RESULTS_DIR, name, 'metrics.json'))
    .filter((path) => existsSync(path))
    .map((path) => JSON.parse(readFileSync(path, 'utf8')) as RunResult)
    .filter((r) => r.scenarioVersion === current.scenarioVersion && r.modes.some((m) => !m.aborted) && compareVersions(r.uroboros.version, current.uroboros.version) < 0)
    .sort((a, b) => compareVersions(b.uroboros.version, a.uroboros.version));
  return older[0];
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

function modeTable(mode: Mode, current: ModeResult, previous?: ModeResult): string {
  if (current.notApplicable) return [`### ${mode}`, '', `NOT APPLICABLE — ${current.notApplicable}.`].join('\n');
  if (current.aborted) {
    return [`### ${mode}`, '', `ABORTED — not measured (${current.aborted.slice(0, 160)}). Re-run this mode with \`--modes ${mode}\`.`].join('\n');
  }
  const lines = [`### ${mode}`, '', `| | ${previous ? 'previous | ' : ''}this run |`, `|---|${previous ? '---|' : ''}---|`];
  for (const [name, show] of ROWS) lines.push(`| ${name} | ${previous ? `${show(previous)} | ` : ''}${show(current)} |`);
  if (current.ambiguity) {
    lines.push('', 'Planted ambiguities:', '');
    for (const v of current.ambiguity.verdicts) lines.push(`- **${v.id}** ${v.verdict} — ${v.evidence.replace(/\s+/g, ' ')}`);
  }
  if (current.error) lines.push('', `Error: \`${current.error}\``);
  return lines.join('\n');
}

export function renderSummary(run: RunResult, previous?: RunResult): string {
  const head = [
    `# uroboros ${run.label}`,
    '',
    `- uroboros: ${run.uroboros.requested} → ${run.uroboros.version} @ ${run.uroboros.commit.slice(0, 7)}${run.uroboros.dirty ? ' (uncommitted changes)' : ''}`,
    `- roles: ${run.profile.modelId} at \`${run.profile.effort}\` effort (the model's default) · Claude Code ${run.profile.claudeCodeVersion} · Agent SDK ${run.sdkVersion}`,
    `- scenario: v${run.scenarioVersion}${run.verifyEvalVersion ? ` · verifier eval: v${run.verifyEvalVersion}` : ''} · started: ${run.startedAt}`,
    `- compared with: ${previous ? `${previous.label} (${previous.profile.modelId} at ${previous.profile.effort})` : 'nothing yet — this is the first result'}`,
  ];
  if (previous && previous.profile.modelId !== run.profile.modelId) {
    head.push(`- ⚠ the role model changed (${previous.profile.modelId} → ${run.profile.modelId}): differences may come from the model, not the plugin.`);
  }
  // The verify row is compared only within one verifier eval version; the other modes, within one scenario version.
  const comparable = (m: ModeResult) => m.mode !== 'verify' || previous?.verifyEvalVersion === run.verifyEvalVersion;
  const tables = run.modes.map((m) => modeTable(m.mode, m, comparable(m) ? previous?.modes.find((p) => p.mode === m.mode && !p.notApplicable) : undefined));
  return [...head, '', ...tables.flatMap((t) => [t, ''])].join('\n');
}
