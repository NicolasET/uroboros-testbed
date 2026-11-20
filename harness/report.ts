import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_MODES, MODES, RESULTS_DIR, type Mode } from './config.ts';
import { implementSection } from './implement-report.ts';
import type { RoleProfile } from './model-profile.ts';
import type { ModeResult, RunResult } from './results.ts';
import { compareVersions } from './versions.ts';

type Row = [string, (r: ModeResult) => string];

const ROWS: Row[] = [
  ['end to end', (r) => (r.e2e.pass ? 'pass' : `FAIL (${failed(r.e2e.checks)})`)],
  ['ambiguities detected', (r) => (r.ambiguity ? `${r.ambiguity.detected}/${r.ambiguity.total}` : '-')],
  ['earlier decisions the idea changes, surfaced', (r) => (r.earlier?.changed ? `${r.earlier.changed.surfaced}/${r.earlier.changed.total}` : '-')],
  ['earlier decision the idea leaves alone, asked again', (r) => (r.earlier?.kept ? (r.earlier.kept.reasked ? 'yes' : 'no') : '-')],
  ['"No sé" to a list (lists · items kept)', (r) => (r.earlier?.idk ? (r.earlier.idk.lists.length ? `${r.earlier.idk.lists.length} · ${r.earlier.idk.kept} kept` : 'not exercised') : '-')],
  ['hidden tests', (r) => (r.hidden ? `${r.hidden.passed}/${r.hidden.total}` : '-')],
  ['runtime tests (real server)', (r) => (r.runtime ? `${r.runtime.passed}/${r.runtime.total}` : '-')],
  ['verifier (pass/fail/not-run per round)', (r) => (r.verifier ? `${r.verifier.rounds.map((v) => `${v.pass}/${v.fail}/${v.notRun}`).join(' → ')}${r.verifier.caught ? ' — caught a failure, fixed' : ''}` : '-')],
  ['verifier detection (caught / runs)', (r) => (r.verifierEval ? r.verifierEval.cases.filter((c) => c.expectFail).map((c) => `${c.name} ${c.runs.filter((x) => x.caught).length}/${c.runs.length}`).join(' · ') : '-')],
  ['verifier detection by a property probe (caught / runs)', (r) => (r.verifierEval?.cases.some((c) => c.runs.some((x) => x.caughtByProperty !== undefined)) ? r.verifierEval.cases.filter((c) => c.runs.some((x) => x.caughtByProperty !== undefined)).map((c) => `${c.name} ${c.runs.filter((x) => x.caughtByProperty).length}/${c.runs.length}`).join(' · ') : '-')],
  ['verifier false failures', (r) => (r.verifierEval ? falseFailures(r) : '-')],
  ['reviewer detection (caught / runs)', (r) => (r.reviewerEval ? r.reviewerEval.cases.filter((c) => c.planted).map((c) => `${c.name} ${c.runs.filter((x) => x.caught).length}/${c.runs.length}`).join(' · ') : '-')],
  ['reviewer detection after the refuter (caught / runs)', (r) => (r.reviewerEval?.cases.some((c) => c.runs.some((x) => x.caughtAfterRefuter !== undefined)) ? r.reviewerEval.cases.filter((c) => c.planted).map((c) => `${c.name} ${c.runs.filter((x) => x.caughtAfterRefuter).length}/${c.runs.length}`).join(' · ') : '-')],
  ['reviewer on the clean copies', (r) => (r.reviewerEval ? reviewerOnClean(r) : '-')],
  ['size the run recorded', (r) => r.flow?.size ?? '-'],
  ['subagents dispatched (implementer · reviewer · refuter · verifier)', (r) => (r.flow ? [r.flow.dispatches.implementer, r.flow.dispatches.reviewer, r.flow.dispatches.refuter, r.flow.dispatches.verifier].join(' · ') : '-')],
  ['reviews, by phase', (r) => (r.flow ? r.flow.reviewPhases.join(' → ') || 'none' : '-')],
  ['goal.md reviewed before any code', (r) => (r.flow ? (r.flow.goalReviewedBeforeCode ? 'yes' : 'no') : '-')],
  ['plan.md written', (r) => (r.flow ? (r.flow.planWritten ? 'yes' : 'no') : '-')],
  ['what the user typed kept inside .git', (r) => (r.flow ? (r.flow.privateRecordInGit ? 'yes' : 'no') : '-')],
  ['resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume', (r) => (r.resumeEval ? [r.resumeEval.interrupted ? 'yes' : 'no', r.resumeEval.markerTakenOver ? 'yes' : 'no', r.resumeEval.goalUnchanged ? 'yes' : 'no', r.resumeEval.questionsOnResume].join(' · ') : '-')],
  ['resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier)', (r) => (r.resumeEval ? [r.resumeEval.before, r.resumeEval.after].map((d) => [d.implementer, d.reviewer, d.refuter, d.verifier].join('/')).join(' → ') : '-')],
  ['parts: split · each part\'s marker · dependencies installed in its worktree · joint report', (r) => (r.partsEval ? [r.partsEval.split ? 'yes' : 'no', r.partsEval.parts.map((p) => `${p.slug} ${p.markerStatus}`).join(', ') || '-', r.partsEval.parts.map((p) => (p.dependencies ? 'yes' : 'no')).join(', ') || '-', `${r.partsEval.jointReport ? 'yes' : 'no'} (${r.partsEval.jointReportLine})`].join(' · ') : '-')],
  ['parts: hidden tests in the main checkout → in each part', (r) => (r.partsEval ? [r.partsEval.mainHidden, ...r.partsEval.parts.map((p) => p.hidden)].map((h) => `filter ${h.filter ? `${h.filter.passed}/${h.filter.total}` : '-'}, startup ${h.startup ? `${h.startup.passed}/${h.startup.total}` : '-'}`).join(' → ') : '-')],
  ['parts: questions (main · each part), cost of each part', (r) => (r.partsEval ? `${r.partsEval.mainQuestions} · ${r.partsEval.parts.map((p) => p.questions).join(', ') || '-'}; ${r.partsEval.parts.map((p) => `$${p.costUsd.toFixed(2)}`).join(', ') || '-'}` : '-')],
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

/** Per clean copy: runs that returned CLEAN, the findings and risks the others reported, and (from 0.29.0) the items left after the refuter. */
function reviewerOnClean(r: ModeResult): string {
  return (r.reviewerEval?.cases ?? [])
    .filter((c) => !c.planted)
    .map((c) => {
      const sum = (pick: (x: (typeof c.runs)[number]) => number) => c.runs.reduce((n, x) => n + pick(x), 0);
      const after = c.runs.some((x) => x.surviving !== undefined) ? ` · after the refuter ${sum((x) => x.surviving ?? 0)}` : '';
      return `${c.name}: CLEAN ${c.runs.filter((x) => x.status === 'CLEAN').length}/${c.runs.length} runs · findings ${sum((x) => x.findings)} · risks ${sum((x) => x.risks)}${after}`;
    })
    .join(' · ');
}

export interface PreviousMode {
  label: string;
  profile: RoleProfile;
  result: ModeResult;
}

/** The eval version an eval mode was measured with: the one its result records, else its run's. */
function evalVersion(run: RunResult, result: ModeResult): number | undefined {
  if (result.mode === 'verify') return result.verifierEval?.version ?? run.verifyEvalVersion;
  if (result.mode === 'review') return result.reviewerEval?.version ?? run.reviewEvalVersion;
  if (result.mode === 'implement') return result.implementEval?.version ?? run.implementEvalVersion;
  if (result.mode === 'small') return result.smallEvalVersion ?? run.smallEvalVersion;
  if (result.mode === 'medium') return result.mediumEvalVersion ?? run.mediumEvalVersion;
  if (result.mode === 'resume') return result.resumeEval?.version ?? run.resumeEvalVersion;
  if (result.mode === 'parts') return result.partsEval?.version ?? run.partsEvalVersion;
  return undefined;
}

/**
 * The eval modes are compared within one eval version, whatever the scenario version: they read neither truth.md's
 * answers nor the earlier feature, and a fixture change bumps their versions too. Every other mode, within one
 * scenario version.
 */
function sameMeasure(older: RunResult, result: ModeResult, current: RunResult): boolean {
  if (result.mode === 'verify') return evalVersion(older, result) === current.verifyEvalVersion;
  if (result.mode === 'review') return evalVersion(older, result) === current.reviewEvalVersion;
  if (result.mode === 'implement') return evalVersion(older, result) === current.implementEvalVersion;
  if (result.mode === 'small') return evalVersion(older, result) === current.smallEvalVersion;
  if (result.mode === 'medium') return evalVersion(older, result) === current.mediumEvalVersion;
  if (result.mode === 'resume') return evalVersion(older, result) === current.resumeEvalVersion;
  if (result.mode === 'parts') return evalVersion(older, result) === current.partsEvalVersion;
  return older.scenarioVersion === current.scenarioVersion;
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
      const result = r.modes.find((m) => m.mode === mode && !m.aborted && !m.notApplicable && sameMeasure(r, m, current));
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
  if (current.implementEval) return [`### ${mode}`, '', ...implementSection(current, previous), ...(current.error ? ['', `Error: \`${current.error}\``] : [])].join('\n');
  const lines = [`### ${mode}`, '', `| | ${previous ? 'previous | ' : ''}this run |`, `|---|${previous ? '---|' : ''}---|`];
  for (const [name, show] of ROWS) lines.push(`| ${name} | ${previous ? `${show(previous)} | ` : ''}${show(current)} |`);
  if (current.ambiguity) {
    lines.push('', 'Planted ambiguities:', '');
    for (const v of current.ambiguity.verdicts) lines.push(`- **${v.id}** ${v.verdict} — ${v.evidence.replace(/\s+/g, ' ')}`);
  }
  if (current.earlier?.changed) {
    lines.push('', 'Earlier decisions the idea changes:', '');
    for (const v of current.earlier.changed.verdicts) lines.push(`- **${v.id}** ${v.verdict} — ${v.evidence.replace(/\s+/g, ' ')}`);
  }
  if (current.earlier?.kept?.reasked) lines.push('', `Earlier decision asked again: ${current.earlier.kept.evidence.replace(/\s+/g, ' ')}`);
  if (current.earlier?.idk?.lists.length) lines.push('', `Lists answered "No sé": ${current.earlier.idk.lists.join(' · ')}`);
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
  if (measured.has('review')) items.push("What the orchestrator does after the refuter: the reviewer eval scores the reviewer's report and, from uroboros 0.29.0, which of its items survive the refuter, but it asks no question and folds nothing.");
  if (measured.has('implement')) items.push('Implement speed on other features: the implement eval resumes one fixed feature whose three user stories share no file, the case parallel implementers are built for; a `tasks.md` whose stories share a file runs one implementer, as the pipeline modes show.');
  // The implement eval runs only when asked for, so a full run does not list it.
  const unmeasured = DEFAULT_MODES.filter((m) => !measured.has(m));
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
    `- scenario: v${run.scenarioVersion}${run.verifyEvalVersion ? ` · verifier eval: v${run.verifyEvalVersion}` : ''}${run.reviewEvalVersion ? ` · reviewer eval: v${run.reviewEvalVersion}` : ''}${run.implementEvalVersion ? ` · implement eval: v${run.implementEvalVersion}` : ''}${run.smallEvalVersion ? ` · small eval: v${run.smallEvalVersion}` : ''}${run.mediumEvalVersion ? ` · medium eval: v${run.mediumEvalVersion}` : ''}${run.resumeEvalVersion ? ` · resume eval: v${run.resumeEvalVersion}` : ''}${run.partsEvalVersion ? ` · parts eval: v${run.partsEvalVersion}` : ''} · started: ${run.startedAt}`,
    `- compared with: ${[...byLabel].map(([label, modes]) => `${modes.join(', ')} → ${label}`).join('; ') || 'nothing yet — this is the first result'}`,
  ];
  for (const model of new Set([...previous.values()].map((p) => p.profile.modelId))) {
    if (model !== run.profile.modelId) head.push(`- ⚠ the role model changed (${model} → ${run.profile.modelId}) for some compared modes: differences may come from the model, not the plugin.`);
  }
  const tables = run.modes.map((m) => modeTable(m.mode, m, previous.get(m.mode)?.result));
  return [...head, '', ...tables.flatMap((t) => [t, '']), ...notProven(run), ''].join('\n');
}
