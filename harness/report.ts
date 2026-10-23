import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MODES, RESULTS_DIR, type Mode } from './config.ts';
import type { RoleProfile } from './model-profile.ts';
import type { ModeResult, RunResult } from './results.ts';
import { compareVersions } from './versions.ts';

type Row = [string, (r: ModeResult) => string];

const ROWS: Row[] = [
  ['end to end', (r) => (r.e2e.pass ? 'pass' : `FAIL (${failed(r.e2e.checks)})`)],
  ['ambiguities detected', (r) => (r.ambiguity ? `${r.ambiguity.detected}/${r.ambiguity.total}` : '-')],
  ['contradicted standing decisions surfaced', (r) => (r.standing?.contradictions ? `${r.standing.contradictions.surfaced}/${r.standing.contradictions.total}` : '-')],
  ['decisions.md at the end', (r) => (r.standing ? (r.standing.file.pass ? 'pass' : `FAIL (${failed(r.standing.file.checks)})`) : '-')],
  ['"No sé" to a list (lists · items kept)', (r) => (r.standing?.idk ? (r.standing.idk.lists.length ? `${r.standing.idk.lists.length} · ${r.standing.idk.kept} kept` : 'not exercised') : '-')],
  ['hidden tests', (r) => (r.hidden ? `${r.hidden.passed}/${r.hidden.total}` : '-')],
  ['runtime tests (real server)', (r) => (r.runtime ? `${r.runtime.passed}/${r.runtime.total}` : '-')],
  ['verifier (pass/fail/not-run per round)', (r) => (r.verifier ? `${r.verifier.rounds.map((v) => `${v.pass}/${v.fail}/${v.notRun}`).join(' → ')}${r.verifier.caught ? ' — caught a failure, fixed' : ''}` : '-')],
  ['verifier detection (caught / runs)', (r) => (r.verifierEval ? r.verifierEval.cases.filter((c) => c.expectFail).map((c) => `${c.name} ${c.runs.filter((x) => x.caught).length}/${c.runs.length}`).join(' · ') : '-')],
  ['verifier false failures', (r) => (r.verifierEval ? falseFailures(r) : '-')],
  ['reviewer detection (caught / runs)', (r) => (r.reviewerEval ? r.reviewerEval.cases.filter((c) => c.planted).map((c) => `${c.name} ${c.runs.filter((x) => x.caught).length}/${c.runs.length}`).join(' · ') : '-')],
  ['reviewer on the clean copy', (r) => (r.reviewerEval ? reviewerOnClean(r) : '-')],
  ['gate (test/typecheck/lint)', (r) => (r.gate ? [r.gate.test, r.gate.typecheck, r.gate.lint].map((ok) => (ok ? '✓' : '✗')).join(' ') : '-')],
  ['questions asked', (r) => String(r.questionsAsked)],
  ['cost (USD, estimate)', (r) => r.costUsd.toFixed(2)],
  ['duration (min)', (r) => (r.durationMs / 60000).toFixed(1)],
  ['output tokens', (r) => String(r.tokens.output)],
];

function failed(checks: Record<string, boolean>): string {
  return Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k).join('; ');
}

/** Clean runs that reported any failure, and failures on scenarios the defect does not break, over all runs. */
function falseFailures(r: ModeResult): string {
  const cases = r.verifierEval?.cases ?? [];
  const clean = cases.filter((c) => !c.expectFail).flatMap((c) => c.runs);
  const stray = cases.flatMap((c) => c.runs).reduce((n, x) => n + x.strayFails, 0);
  const notRun = cases.flatMap((c) => c.runs).reduce((n, x) => n + x.notRun, 0);
  return `clean ${clean.filter((x) => x.strayFails > 0).length}/${clean.length} runs · stray fails ${stray} · not-run ${notRun}`;
}

/** Clean-copy runs that returned CLEAN, and the findings and risks the others reported. */
function reviewerOnClean(r: ModeResult): string {
  const clean = (r.reviewerEval?.cases ?? []).filter((c) => !c.planted).flatMap((c) => c.runs);
  const sum = (pick: (x: (typeof clean)[number]) => number) => clean.reduce((n, x) => n + pick(x), 0);
  return `CLEAN ${clean.filter((x) => x.status === 'CLEAN').length}/${clean.length} runs · findings ${sum((x) => x.findings)} · risks ${sum((x) => x.risks)}`;
}

export interface PreviousMode {
  label: string;
  profile: RoleProfile;
  result: ModeResult;
}

/**
 * The eval modes are compared within one eval version, whatever the scenario version: they read neither truth.md's
 * answers nor the standing decisions, and a fixture change bumps their versions too. Every other mode, within one
 * scenario version.
 */
function sameMeasure(mode: Mode, a: RunResult, b: RunResult): boolean {
  if (mode === 'verify') return a.verifyEvalVersion === b.verifyEvalVersion;
  if (mode === 'review') return a.reviewEvalVersion === b.reviewEvalVersion;
  return a.scenarioVersion === b.scenarioVersion;
}

/**
 * For each mode, the most recent earlier result (a lower uroboros version) that measured that mode the same way.
 * Per mode, not per run: a result that measured only some modes must not hide an older one for the others.
 */
export function previousModes(current: RunResult): Map<Mode, PreviousMode> {
  const previous = new Map<Mode, PreviousMode>();
  if (!existsSync(RESULTS_DIR)) return previous;
  const older = readdirSync(RESULTS_DIR)
    .map((name) => join(RESULTS_DIR, name, 'metrics.json'))
    .filter((path) => existsSync(path))
    .map((path) => JSON.parse(readFileSync(path, 'utf8')) as RunResult)
    .filter((r) => compareVersions(r.uroboros.version, current.uroboros.version) < 0)
    .sort((a, b) => compareVersions(b.uroboros.version, a.uroboros.version) || b.startedAt.localeCompare(a.startedAt));
  for (const mode of MODES) {
    for (const r of older) {
      const result = sameMeasure(mode, r, current) ? r.modes.find((m) => m.mode === mode && !m.aborted && !m.notApplicable) : undefined;
      if (result) {
        previous.set(mode, { label: r.label, profile: r.profile, result });
        break;
      }
    }
  }
  return previous;
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
  if (current.standing?.contradictions) {
    lines.push('', 'Contradicted standing decisions:', '');
    for (const v of current.standing.contradictions.verdicts) lines.push(`- **${v.id}** ${v.verdict} — ${v.evidence.replace(/\s+/g, ' ')}`);
  }
  if (current.standing?.idk?.lists.length) lines.push('', `Lists answered "No sé": ${current.standing.idk.lists.join(' · ')}`);
  if (current.error) lines.push('', `Error: \`${current.error}\``);
  return lines.join('\n');
}

/** What no result of this testbed proves, plus what this result left unmeasured. */
function notProven(run: RunResult): string[] {
  const measured = new Set(run.modes.filter((m) => !m.aborted && !m.notApplicable).map((m) => m.mode));
  const items = [
    'The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.',
    'Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.',
    'Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.',
  ];
  if (measured.has('review')) items.push("The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.");
  const unmeasured = MODES.filter((m) => !measured.has(m));
  if (unmeasured.length) items.push(`Modes not measured in this result: ${unmeasured.join(', ')}.`);
  return ['## Not proven by this run', '', ...items.map((i) => `- ${i}`)];
}

export function renderSummary(run: RunResult, previous: Map<Mode, PreviousMode>): string {
  const byLabel = new Map<string, Mode[]>();
  for (const m of run.modes) {
    const label = previous.get(m.mode)?.label ?? 'nothing yet';
    byLabel.set(label, [...(byLabel.get(label) ?? []), m.mode]);
  }
  const head = [
    `# uroboros ${run.label}`,
    '',
    `- uroboros: ${run.uroboros.requested} → ${run.uroboros.version} @ ${run.uroboros.commit.slice(0, 7)}${run.uroboros.dirty ? ' (uncommitted changes)' : ''}`,
    `- roles: ${run.profile.modelId} at \`${run.profile.effort}\` effort (the model's default) · Claude Code ${run.profile.claudeCodeVersion} · Agent SDK ${run.sdkVersion}`,
    `- scenario: v${run.scenarioVersion}${run.verifyEvalVersion ? ` · verifier eval: v${run.verifyEvalVersion}` : ''}${run.reviewEvalVersion ? ` · reviewer eval: v${run.reviewEvalVersion}` : ''} · started: ${run.startedAt}`,
    `- compared with: ${[...byLabel].map(([label, modes]) => `${modes.join(', ')} → ${label}`).join('; ') || 'nothing yet — this is the first result'}`,
  ];
  for (const model of new Set([...previous.values()].map((p) => p.profile.modelId))) {
    if (model !== run.profile.modelId) head.push(`- ⚠ the role model changed (${model} → ${run.profile.modelId}) for some compared modes: differences may come from the model, not the plugin.`);
  }
  const tables = run.modes.map((m) => modeTable(m.mode, m, previous.get(m.mode)?.result));
  return [...head, '', ...tables.flatMap((t) => [t, '']), ...notProven(run), ''].join('\n');
}
