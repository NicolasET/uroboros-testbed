// The reviewer eval (`review` mode): the plugin's real reviewer, dispatched with the orchestrator's implement step-B
// prompt on a change that carries one planted defect and still passes the gate, and on a clean copy. It measures what
// the pipeline modes cannot: whether the reviewer's report names a defect the gate does not catch (detection), and
// what it reports on a clean change. No pipeline runs; the change is the reference implementation plus its tests.
// The prompt follows the step-B protocol of the uroboros version measured (`stepBPrompt`). The reviewer's report is
// scored as it arrives (raw), and from 0.29.0 again after step C's refuter (`refuterPrompt`): an item the refuter drops
// never reaches the user or a fix, so a defect named only by dropped items is lost there.
import { createHash } from 'node:crypto';
import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ModelUsage } from '@anthropic-ai/claude-agent-sdk';
import { JUDGE_MODEL, REVIEW_EVAL_RUNS, REVIEW_EVAL_VERSION, ROOT, SCENARIO_DIR } from './config.ts';
import { exec, execOrThrow } from './exec.ts';
import type { RoleProfile } from './model-profile.ts';
import type { Oracle } from './oracle.ts';
import { sumTokens, usageLimitError, type ModeResult } from './results.ts';
import { runSession } from './session.ts';
import { snapshot, writeRunDiff } from './snapshot.ts';
import { askStructured } from './structured.ts';
import { subagentReports } from './transcript.ts';
import { runGate, type GateResult } from './verify.ts';
import { agentCall, atLeast, SINGLE_FLOW_FROM } from './versions.ts';
import { createWorkspace } from './workspace.ts';

export const REVIEW_DIR = join(SCENARIO_DIR, 'review');
/** From uroboros 1.0.0 the fixed feature is a goal.md feature under .uroboros/; before it, a spec-kit one under specs/. */
export const goalForm = (version: string): boolean => atLeast(version, SINGLE_FLOW_FROM);
export const featurePath = (version: string): string => (goalForm(version) ? join('.uroboros', 'pause-listing') : join('specs', '001-pause-listing'));
/** The fixed feature's files under scenario/review/: feature/ (spec, plan, tasks) or feature-goal/ (goal.md, and what the user typed). */
const featureSource = (version: string): string => join(REVIEW_DIR, goalForm(version) ? 'feature-goal' : 'feature');
/** The first uroboros version whose step-B prompt this eval reproduces (ROUND, FOLDS, STANDING_DECISIONS, model guides). */
export const FIRST_VERSION = '0.16.0';
/** The first version whose step-B protocol this eval does not reproduce yet: extend `stepBPrompt` before measuring it. 0.29.0 passes `EARLIER_FEATURES` in place of `STANDING_DECISIONS`, only when the project has earlier features, and this eval's workspace has none, so its prompt is unchanged. 0.30.0 leaves step B as it was: its parts protocol starts other sessions and does not touch a review. 0.31.0 adds `REVIEW_RULES` and the state file's `JUDGING SOURCES` and `REVIEW RULES` (`JUDGING_FROM`). */
export const UNKNOWN_FROM = '1.1.0';
/** From this version the state file carries what the implementer declared as not asked for (`### Unrequested (declared)`), and a dispatch names one agent per role with the effort on the call (`agentCall`); step B's inputs are unchanged. */
export const UNREQUESTED_FROM = '0.32.0';
const UNREQUESTED = '\n### Unrequested (declared)\n\n- round 1: none\n';
/** From this version the state file records `JUDGING SOURCES` and `REVIEW RULES`, and step B passes `REVIEW_RULES` when the project has a `REVIEW.md`. */
export const JUDGING_FROM = '0.31.0';
const JUDGING_SOURCES = "- JUDGING SOURCES: specs/ .uroboros/ .specify/ '.claude/skills/speckit-*' ':(glob)**/REVIEW.md' ':(glob)**/CLAUDE.md' ':(glob)**/AGENTS.md' ':(exclude).uroboros/active-run.json'";
/** The first version whose step-C refuter dispatch this eval reproduces (`EARLIER_FEATURES` in place of `STANDING_DECISIONS`); earlier versions are scored raw only. */
export const REFUTER_FROM = '0.29.0';
/** Refuter reasons that drop an item: it is neither asked nor folded. `decided` and `discoverable` are folded, so the item still acts. */
const DROPPING = new Set(['unreachable', 'no-outcome', 'not-this-run']);
/** From this version step B passes the run's diff between working-tree snapshots (`BASE TREE`, `ROUND TREE`, `RUN_DIFF`). */
export const SNAPSHOTS_FROM = '0.17.0';
/** From this version the state file carries the intake's `SURFACES` and the implementer's `### Shared code touched`. */
export const SURFACES_FROM = '0.18.0';
/** From this version the state file carries the implementer's `### Red first` lines. */
export const RED_FIRST_FROM = '0.19.0';
const RED_FIRST = '\n### Red first\n\n- round 1: not captured — the tests in test/pause.test.ts were written after the code\n';
/** From this version the state file records implement's plan of waves; step B itself is unchanged. One implementer built the fixed feature. */
export const WAVES_FROM = '0.25.0';
const WAVES = '\n### Waves\n\n- none — one dispatch got every task\n';
const WAVES_GOAL = '\n### Waves\n\n- none — one dispatch got every criterion\n';
/** The judging sources uroboros 1.0.0 records: no spec-kit path. */
const JUDGING_SOURCES_GOAL = "- JUDGING SOURCES: .uroboros/ specs/ ':(glob)**/REVIEW.md' ':(glob)**/CLAUDE.md' ':(glob)**/AGENTS.md' ':(exclude).uroboros/active-run.json'";
/** The surfaces the fixed feature's intake would have recorded: every one of them is in scope. */
const SURFACES = 'SURFACES: HTTP API only — POST /listings/:id/pause and /resume (in scope); GET /listings search (in scope: paused listings hidden); GET /listings/:id (in scope: shows the status); POST /listings/:id/orders (in scope: refused while paused); the published route table in src/gateway.ts (in scope). No UI, CLI or background jobs.';

/** The snapshots of a run from 0.17.0: the tree before the change, the tree after it, and the written run diff. */
export interface RunTrees {
  base: string;
  round: string;
  runDiff: string;
  /** From 0.31.0, when the case has review rules: the rules file step B passes as `REVIEW_RULES`. */
  reviewRules?: string;
  /** From 1.0.0: the private record of what the user typed, inside .git, which step B passes as `PRIVATE_RECORD`. */
  privateRecord?: string;
}

export interface ReviewCase {
  name: string;
  /** Directory under `scenario/review/` copied over the implementation; null for the clean copy. */
  overlay: string | null;
  /** The planted defect in plain words, for the judge; null for the clean copy. */
  defect: string | null;
  /** Directory under `scenario/review/` holding the project's `REVIEW.md`, laid down before the change, so it is part of the base. */
  rules?: string | null;
}

/** One finding or risk of a LOOP-REVIEW-FINDINGS report, as step C splits them. */
export interface ReviewItem {
  id: string;
  weight?: string;
  /** A `derived_from:` finding is folded without the refuter, as a `proof` one is fixed without it. */
  derived: boolean;
  /** The item's lines verbatim, for the refuter's `FINDINGS:`. */
  text: string;
}

export interface ReviewRun {
  reported: boolean;
  status?: string;
  findings: number;
  risks: number;
  /** Defect cases only: the judge found a finding or risk that names the planted defect. */
  caught?: boolean;
  judgeEvidence?: string;
  /** The ids of the items the judge says name the defect. */
  judgeIds?: string[];
  /** From 0.29.0: the items still acting after the refuter — not sent to it (`proof`, `derived_from`), or not dropped by it. */
  surviving?: number;
  /** From 0.29.0, defect cases: an item naming the defect survived the refuter. */
  caughtAfterRefuter?: boolean;
  /** From 0.29.0: the refuter returned its results (or had nothing to refute). */
  refuterReported?: boolean;
  /** The case's gate (test, typecheck, lint) was green, as every case requires. */
  gateGreen: boolean;
  /** The working tree differed after the session. */
  touched: boolean;
  costUsd: number;
  durationMs: number;
  error?: string;
}

export interface ReviewerEval {
  version: number;
  cases: Array<{ name: string; planted: boolean; runs: ReviewRun[] }>;
}

export function readReviewCases(): ReviewCase[] {
  return JSON.parse(readFileSync(join(REVIEW_DIR, 'cases.json'), 'utf8')) as ReviewCase[];
}

/** The fixed feature artifacts: spec, plan, tasks and the state file after implement's first round. */
export function copyFeature(workspace: string, version = '0.32.0'): void {
  cpSync(featureSource(version), join(workspace, featurePath(version)), { recursive: true, filter: (source) => !source.endsWith('private-record.md') });
}

/** From 1.0.0: what the user typed, written where the plugin keeps it — inside .git, never in the working tree. */
export async function writePrivateRecord(workspace: string): Promise<string> {
  const common = resolve(workspace, (await execOrThrow('git', ['rev-parse', '--git-common-dir'], workspace)).trim());
  const target = join(common, 'uroboros', 'private', 'pause-listing.md');
  mkdirSync(dirname(target), { recursive: true });
  cpSync(join(REVIEW_DIR, 'feature-goal', 'private-record.md'), target);
  return target;
}

/** The case's project review rules (`REVIEW.md`), laid down with the feature artifacts, before the change. */
export function copyRules(workspace: string, c: ReviewCase): void {
  if (c.rules) cpSync(join(REVIEW_DIR, c.rules), workspace, { recursive: true });
}

/** Lays the change over a fixture copy: the reference implementation, its tests, then the case's defect. */
export function buildReviewCase(workspace: string, c: ReviewCase): void {
  cpSync(join(ROOT, 'harness', 'reference', 'src'), join(workspace, 'src'), { recursive: true });
  cpSync(join(REVIEW_DIR, 'implementation'), workspace, { recursive: true });
  if (c.overlay) cpSync(join(REVIEW_DIR, c.overlay), workspace, { recursive: true });
}

/**
 * The fixture and the feature artifacts committed, the change left uncommitted: the tree a reviewer sees after implement's
 * first round. From 0.17.0 the orchestrator also took `BASE TREE` before the change and `ROUND TREE 1` after it, wrote the run
 * diff, and recorded both trees, the green gate baseline and the implementer's (empty) `gate_touched` in the state file.
 */
export async function prepareWorkspace(c: ReviewCase, version: string): Promise<{ workspace: string; trees?: RunTrees }> {
  const workspace = await createWorkspace('review');
  copyFeature(workspace, version);
  copyRules(workspace, c);
  await execOrThrow('git', ['add', '-A'], workspace);
  await execOrThrow('git', ['commit', '--quiet', '-m', 'feature-artifacts'], workspace);
  if (!atLeast(version, SNAPSHOTS_FROM)) {
    buildReviewCase(workspace, c);
    return { workspace };
  }
  const privateRecord = goalForm(version) ? await writePrivateRecord(workspace) : undefined;
  const base = await snapshot(workspace);
  buildReviewCase(workspace, c);
  const round = await snapshot(workspace);
  const runDiff = await writeRunDiff(workspace, base, round);
  appendFileSync(
    join(workspace, featurePath(version), 'loop-state.md'),
    `- BASE TREE: ${base}
- GATE BASELINE: ${base} — pass
- ROUND TREE 1: ${round}

### Gate touched

- round 1: none
${atLeast(version, SURFACES_FROM) ? `\n### Shared code touched\n\n- round 1: none\n${goalForm(version) ? '' : `\n${SURFACES}\n`}` : ''}${atLeast(version, RED_FIRST_FROM) ? RED_FIRST : ''}${atLeast(version, WAVES_FROM) ? (goalForm(version) ? WAVES_GOAL : WAVES) : ''}${atLeast(version, UNREQUESTED_FROM) ? UNREQUESTED : ''}`,
  );
  if (!atLeast(version, JUDGING_FROM)) return { workspace, trees: { base, round, runDiff } };
  const reviewRules = c.rules ? await writeReviewRules(workspace, base) : undefined;
  appendFileSync(
    join(workspace, featurePath(version), 'loop-state.md'),
    `\n${goalForm(version) ? JUDGING_SOURCES_GOAL : JUDGING_SOURCES}\n- REVIEW RULES: ${reviewRules ? 'REVIEW.md' : 'none'}\n${privateRecord ? `- PRIVATE RECORD: ${privateRecord}\n` : ''}`,
  );
  return { workspace, trees: { base, round, runDiff, reviewRules, privateRecord } };
}

/** The root `REVIEW.md` as the base tree holds it, under its path, where the plugin writes it (implement protocol, Review rules). */
async function writeReviewRules(workspace: string, base: string): Promise<string> {
  const target = resolve(workspace, (await execOrThrow('git', ['rev-parse', '--git-path', 'uroboros/review-rules.md'], workspace)).trim());
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `## REVIEW.md\n\n${await execOrThrow('git', ['show', `${base}:REVIEW.md`], workspace)}`);
  return target;
}

const lines = (text: string) => text.split(/\r?\n/).filter(Boolean);

/** The changed-file list step B of the measured version passes: tracked changes, plus untracked files from 0.16.2; from 0.17.0, the files that differ between the snapshots. */
export async function changedFiles(workspace: string, version: string, trees?: RunTrees): Promise<string[]> {
  if (trees) return lines(await execOrThrow('git', ['diff', '--name-only', trees.base, trees.round], workspace));
  const tracked = lines(await execOrThrow('git', ['diff', '--name-only'], workspace));
  if (!atLeast(version, '0.16.2')) return tracked;
  return [...tracked, ...lines(await execOrThrow('git', ['ls-files', '--others', '--exclude-standard'], workspace))];
}

/** A role's section (`## Reviewer`, `## Refuter`) of the plugin's model guide for this exact model, which a dispatch pastes verbatim. */
export function reviewerGuide(pluginDir: string, modelId: string, role = 'Reviewer'): string | undefined {
  const dir = join(pluginDir, 'references', 'model-guides');
  if (!existsSync(dir)) return undefined;
  const id = modelId.replace(/\[.*\]$/, '');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(dir, file), 'utf8').replace(/\r\n/g, '\n');
    if (/^model_id:\s*(.+)$/m.exec(text)?.[1]?.trim() !== id) continue;
    const heading = `\n## ${role}\n`;
    const start = text.indexOf(heading);
    if (start < 0) return undefined;
    const body = text.slice(start + heading.length);
    const end = body.indexOf('\n## ');
    return (end < 0 ? body : body.slice(0, end)).trim();
  }
  return undefined;
}

/** The DECISION LOG lines of the fixed state file, so the prompt and the file say the same. */
function decisionLog(version: string): string {
  const state = readFileSync(join(featureSource(version), 'loop-state.md'), 'utf8');
  return lines(state).filter((line) => /^- D\d+ /.test(line)).join('\n');
}

function gateLine(gate: GateResult): string {
  const failing = (['test', 'typecheck', 'lint'] as const).filter((k) => !gate[k]);
  return failing.length ? `FAIL — ${failing.map((k) => `npm run ${k}`).join(', ')}` : 'pass — `npm test`, `npm run typecheck`, `npm run lint`';
}

export interface StepBInput {
  workspace: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  changed: string[];
  diffStat: string;
  gate: GateResult;
  guide?: string;
  /** From 0.17.0: the path of the run's unified diff. */
  runDiff?: string;
  /** From 0.31.0, when the project has a `REVIEW.md`: the rules file. */
  reviewRules?: string;
  /** From 1.0.0: the private record's path. */
  privateRecord?: string;
}

/** The inputs step B passes after its `ROUND` line, which step C's refuter receives too (all but ROUND, FOLDS and the instruction line). */
function sharedInputs(input: StepBInput): string[] {
  const feature = join(input.workspace, featurePath(input.version));
  // Step B of the loop protocol (uroboros 1.0.0+): the state file with the private record, goal.md, then what implement adds.
  if (goalForm(input.version)) {
    if (!input.privateRecord) throw new Error(`step B of ${input.version} passes PRIVATE_RECORD`);
    return [
      'RUN_MODE: default',
      `STATE_FILE: ${join(feature, 'loop-state.md')}`,
      `PRIVATE_RECORD: ${input.privateRecord}`,
      `GOAL_FILE: ${join(feature, 'goal.md')}`,
      'DECISION LOG:',
      decisionLog(input.version),
      `RUN_DIFF: ${input.runDiff}`,
      'DIFF STAT:',
      input.diffStat,
      `CHANGED FILES: ${input.changed.join(', ')}`,
      `GATE RESULT: ${gateLine(input.gate)}`,
      ...(input.reviewRules ? [`REVIEW_RULES: ${input.reviewRules}`] : []),
    ];
  }
  return [
    'RUN_MODE: default',
    `STATE_FILE: ${join(feature, 'loop-state.md')}`,
    `FEATURE_DIR: ${feature}`,
    `ARTIFACTS: ${['spec.md', 'plan.md', 'tasks.md'].map((f) => join(feature, f)).join(', ')}`,
    ...(input.runDiff ? [`RUN_DIFF: ${input.runDiff}`] : []),
    `CHANGED FILES: ${input.changed.join(', ')}`,
    'DIFF STAT:',
    input.diffStat,
    'DECISION LOG:',
    decisionLog(input.version),
    `GATE RESULT: ${gateLine(input.gate)}`,
    ...(input.reviewRules && atLeast(input.version, JUDGING_FROM) ? [`REVIEW_RULES: ${input.reviewRules}`] : []),
  ];
}

/** Wraps a dispatch so the main thread runs it on the reviewer agent with the chosen model and effort and replies with the report verbatim. */
function dispatchVerbatim(profile: RoleProfile, version: string, dispatch: string[]): string {
  return [
    `Use the Agent tool once: ${agentCall('reviewer', profile, version)}, and as its prompt exactly the text between the markers. Wait for its report, then reply with the report verbatim and nothing else. Do not run, read or change anything yourself.`,
    '<<<',
    dispatch.join('\n'),
    '>>>',
  ].join('\n');
}

function checkVersion(input: StepBInput): void {
  if (!atLeast(input.version, FIRST_VERSION) || atLeast(input.version, UNKNOWN_FROM)) {
    throw new Error(`the reviewer eval reproduces step B for ${FIRST_VERSION} up to before ${UNKNOWN_FROM}, not ${input.version}`);
  }
  if (atLeast(input.version, SNAPSHOTS_FROM) && !input.runDiff) throw new Error(`step B of ${input.version} passes RUN_DIFF`);
}

/** The orchestrator's implement step-B prompt for the measured version, handed to the main thread to dispatch verbatim. */
export function stepBPrompt(input: StepBInput): string {
  checkVersion(input);
  return dispatchVerbatim(input.profile, input.version, [
    `INSTRUCTIONS: ${join(input.pluginDir, 'references', 'reviewer-instructions.md')}`,
    'PHASE: implement',
    'ROUND: 1',
    ...sharedInputs(input),
    ...(input.guide ? ['MODEL GUIDE:', input.guide] : []),
    'Read the state file first; interrogate per your profile (from round 2, verify the folds only); CLEAN requires evidence; do not re-report anything already resolved in the state file, DECISION LOG, or ASSUMPTION LOG.',
  ]);
}

/**
 * Step C's refuter dispatch for the measured version (from 0.29.0): the reviewer variant of the refuter's effort — the
 * reviewer's, with no `--refuter=` — with the refuter instructions, the inputs step B passed but ROUND, FOLDS and the
 * instruction line, the refuter's guide section, and the items to refute verbatim.
 */
export function refuterPrompt(input: StepBInput, items: ReviewItem[], guide?: string): string {
  checkVersion(input);
  if (!atLeast(input.version, REFUTER_FROM)) throw new Error(`the reviewer eval reproduces step C's refuter from ${REFUTER_FROM}, not ${input.version}`);
  return dispatchVerbatim(input.profile, input.version, [
    `INSTRUCTIONS: ${join(input.pluginDir, 'references', 'refuter-instructions.md')}`,
    'PHASE: implement',
    ...sharedInputs(input),
    ...(guide ? ['MODEL GUIDE:', guide] : []),
    'FINDINGS:',
    ...items.map((i) => i.text),
  ]);
}

/** The findings and risks of one LOOP-REVIEW-FINDINGS report, each with its lines verbatim. */
export function parseItems(report: string): ReviewItem[] {
  const items: ReviewItem[] = [];
  let current: { id: string; lines: string[] } | undefined;
  const close = () => {
    if (!current) return;
    const text = current.lines.join('\n');
    items.push({ id: current.id, weight: /^\s*weight:\s*(\w+)/m.exec(text)?.[1], derived: /^\s*derived_from:\s*\S/m.test(text), text });
  };
  for (const line of report.split(/\r?\n/)) {
    const id = /^\s*-\s*id:\s*([FR]\d+)\b/.exec(line);
    if (id?.[1]) {
      close();
      current = { id: id[1], lines: [line] };
    } else if (/^[a-z_]+:/.test(line) || line.trim() === '```') {
      close();
      current = undefined;
    } else if (current) {
      current.lines.push(line);
    }
  }
  close();
  return items;
}

/** The items step C sends to the refuter: every one but a `proof` finding (fixed) and a `derived_from` one (folded). */
export const toRefute = (items: ReviewItem[]): ReviewItem[] => items.filter((i) => i.weight !== 'proof' && !i.derived);

/** Each result of one LOOP-REFUTER-RESULTS report: its outcome and, when refuted, its reason. */
export function parseRefuter(report: string): Map<string, { outcome: string; reason?: string }> {
  const results = new Map<string, { outcome: string; reason?: string }>();
  let id: string | undefined;
  for (const line of report.split(/\r?\n/)) {
    const start = /^\s*-\s*id:\s*([FR]\d+)\b/.exec(line);
    if (start?.[1]) {
      id = start[1];
      results.set(id, { outcome: '' });
      continue;
    }
    const field = /^\s*(outcome|reason):\s*([\w-]+)/.exec(line);
    if (field?.[1] && field[2] && id) results.get(id)![field[1] as 'outcome' | 'reason'] = field[2];
  }
  return results;
}

/** An item still acts after step C unless the refuter refuted it with a reason that drops it. An item with no result counts as inconclusive. */
export function survives(item: ReviewItem, refuted: Map<string, { outcome: string; reason?: string }>): boolean {
  const r = refuted.get(item.id);
  return !(r?.outcome === 'refuted' && r.reason !== undefined && DROPPING.has(r.reason));
}

/** Status and item counts of one LOOP-REVIEW-FINDINGS report. */
export function parseReview(report: string | undefined): Pick<ReviewRun, 'reported' | 'status' | 'findings' | 'risks'> {
  if (!report) return { reported: false, findings: 0, risks: 0 };
  return {
    reported: true,
    status: /^\s*status:\s*(\w+)/m.exec(report)?.[1],
    findings: (report.match(/^\s*-\s*id:\s*F\d+/gm) ?? []).length,
    risks: (report.match(/^\s*-\s*id:\s*R\d+/gm) ?? []).length,
  };
}

/**
 * A catch needs the judge's yes and an item the orchestrator would act on: a report with no finding and no risk
 * (CLEAN) closes the phase, so naming the defect in passing — e.g. dismissed as already there — catches nothing.
 */
export function isCatch(judgeSaysCaught: boolean, run: Pick<ReviewRun, 'findings' | 'risks'>): boolean {
  return judgeSaysCaught && run.findings + run.risks > 0;
}

/** Asks the pinned judge whether any finding or risk of the report names the planted defect, and which ones. */
async function judgeCatch(defect: string, report: string): Promise<{ caught: boolean; evidence: string; ids: string[]; costUsd: number }> {
  const prompt = [
    'A code reviewer audited a change that contains exactly one planted defect.',
    `PLANTED DEFECT: ${defect}`,
    `REVIEWER REPORT:\n${report}`,
    'Does any finding or risk in the report identify this defect — what is wrong, where, or its effect? A finding about something else in the same file does not count, and neither does evidence listed under a CLEAN status. Quote the decisive finding or risk (at most 300 characters), or say why none matches. List the id (F1, R2, …) of every finding or risk that identifies it, or none.',
  ].join('\n\n');
  const schema = {
    type: 'object',
    properties: { caught: { type: 'boolean' }, evidence: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } } },
    required: ['caught', 'evidence', 'ids'],
  };
  const { value, costUsd } = await askStructured<{ caught: boolean; evidence: string; ids: string[] }>(JUDGE_MODEL, prompt, schema);
  return { ...value, costUsd };
}

/** A fingerprint of the working tree: status, tracked diff and the content of every untracked file. */
async function treeState(workspace: string): Promise<string> {
  const status = await execOrThrow('git', ['status', '--porcelain', '--untracked-files=all'], workspace);
  const hash = createHash('sha256').update(status).update((await exec('git', ['diff'], workspace)).output);
  for (const line of lines(status).filter((l) => l.startsWith('?? '))) hash.update(readFileSync(join(workspace, line.slice(3))));
  return hash.digest('hex');
}

interface ReviewModeRequest {
  runDir: string;
  pluginDir: string;
  version: string;
  profile: RoleProfile;
  oracle: Oracle;
  /** Pilot only: run just these cases. */
  cases?: string[];
}

/** Runs every case `REVIEW_EVAL_RUNS` times, sequentially, and scores the mode. */
export async function runReviewMode(req: ReviewModeRequest): Promise<ModeResult> {
  const startedAt = new Date().toISOString();
  const base = { mode: 'review' as const, startedAt, harnessCostUsd: 0, questionsAsked: 0 };
  if (!atLeast(req.version, FIRST_VERSION)) {
    return { ...base, durationMs: 0, costUsd: 0, tokens: sumTokens({}), models: [], e2e: { pass: true, checks: {} }, notApplicable: `the reviewer eval reproduces step B from uroboros ${FIRST_VERSION}` };
  }

  const askedBefore = req.oracle.asked;
  const usage: Record<string, ModelUsage>[] = [];
  const failures: string[] = [];
  const evaluation: ReviewerEval = { version: REVIEW_EVAL_VERSION, cases: [] };
  const guide = reviewerGuide(req.pluginDir, req.profile.modelId);
  const refuterGuide = reviewerGuide(req.pluginDir, req.profile.modelId, 'Refuter');
  let costUsd = 0;
  let judgeCostUsd = 0;
  let durationMs = 0;
  let aborted: string | undefined;

  for (const c of readReviewCases().filter((x) => !req.cases || req.cases.includes(x.name))) {
    const entry = { name: c.name, planted: c.defect !== null, runs: [] as ReviewRun[] };
    evaluation.cases.push(entry);
    for (let i = 1; i <= REVIEW_EVAL_RUNS && !aborted; i++) {
      const { workspace, trees } = await prepareWorkspace(c, req.version);
      const dir = join(req.runDir, 'review', `${c.name}-${i}`);
      mkdirSync(dir, { recursive: true });
      console.log(`[review] ${c.name} ${i}/${REVIEW_EVAL_RUNS} in ${workspace}`);
      const gate = await runGate(workspace);
      const input: StepBInput = {
        workspace,
        pluginDir: req.pluginDir,
        version: req.version,
        profile: req.profile,
        changed: await changedFiles(workspace, req.version, trees),
        diffStat: await execOrThrow('git', trees ? ['diff', '--stat', trees.base, trees.round] : ['diff', '--stat'], workspace),
        gate,
        guide,
        runDiff: trees?.runDiff,
        reviewRules: trees?.reviewRules,
        privateRecord: trees?.privateRecord,
      };
      const before = await treeState(workspace);
      const transcriptPath = join(dir, 'transcript.jsonl');
      const session = await runSession({ mode: 'review', cwd: workspace, prompt: stepBPrompt(input), pluginDir: req.pluginDir, profile: req.profile, oracle: req.oracle, transcriptPath });
      costUsd += session.costUsd;
      durationMs += session.durationMs;
      usage.push(session.modelUsage);
      aborted = usageLimitError(session.error);
      if (aborted) break;
      const reports = subagentReports(transcriptPath, 'LOOP-REVIEW-FINDINGS');
      const report = reports[reports.length - 1];
      const run: ReviewRun = {
        ...parseReview(report),
        gateGreen: gate.test && gate.typecheck && gate.lint,
        touched: false,
        costUsd: session.costUsd,
        durationMs: session.durationMs,
        error: session.error,
      };
      if (c.defect && report) {
        try {
          const verdict = await judgeCatch(c.defect, report);
          judgeCostUsd += verdict.costUsd;
          Object.assign(run, { caught: isCatch(verdict.caught, run), judgeEvidence: verdict.evidence, judgeIds: verdict.ids });
        } catch (e) {
          failures.push(`${c.name}-${i}: judge: ${String(e).slice(0, 300)}`);
        }
      }
      if (report && atLeast(req.version, REFUTER_FROM)) {
        const items = parseItems(report);
        const sent = toRefute(items);
        let refuted = new Map<string, { outcome: string; reason?: string }>();
        run.refuterReported = true;
        if (sent.length) {
          const refuterTranscript = join(dir, 'refuter-transcript.jsonl');
          const refuter = await runSession({ mode: 'review', cwd: workspace, prompt: refuterPrompt(input, sent, refuterGuide), pluginDir: req.pluginDir, profile: req.profile, oracle: req.oracle, transcriptPath: refuterTranscript });
          costUsd += refuter.costUsd;
          durationMs += refuter.durationMs;
          run.costUsd += refuter.costUsd;
          run.durationMs += refuter.durationMs;
          usage.push(refuter.modelUsage);
          aborted = usageLimitError(refuter.error);
          if (refuter.error) failures.push(`${c.name}-${i}: refuter: ${refuter.error}`);
          const results = subagentReports(refuterTranscript, 'LOOP-REFUTER-RESULTS');
          const result = results[results.length - 1];
          run.refuterReported = result !== undefined;
          if (result) refuted = parseRefuter(result);
        }
        if (run.refuterReported) {
          const kept = new Set(items.filter((item) => survives(item, refuted)).map((item) => item.id));
          run.surviving = kept.size;
          if (run.caught !== undefined) run.caughtAfterRefuter = run.caught && (run.judgeIds ?? []).some((id) => kept.has(id));
        }
      }
      run.touched = (await treeState(workspace)) !== before;
      entry.runs.push(run);
      if (aborted) break;
      if (session.error) failures.push(`${c.name}-${i}: ${session.error}`);
    }
    if (aborted) break;
  }

  const runs = evaluation.cases.flatMap((c) => c.runs);
  const merged: Record<string, ModelUsage> = {};
  usage.forEach((u, i) => Object.entries(u).forEach(([model, mu]) => (merged[`${model}#${i}`] = mu)));
  const checks = {
    'every run returned a report': runs.length > 0 && runs.every((r) => r.reported),
    ...(atLeast(req.version, REFUTER_FROM) ? { 'every refuter returned its results': runs.every((r) => !r.reported || r.refuterReported) } : {}),
    'every case had a green gate': runs.every((r) => r.gateGreen),
    'no run changed the repo': runs.every((r) => !r.touched),
    'no session error': runs.every((r) => !r.error),
  };
  return {
    ...base,
    durationMs,
    costUsd,
    harnessCostUsd: judgeCostUsd,
    questionsAsked: req.oracle.asked - askedBefore,
    tokens: sumTokens(merged),
    models: [...new Set(usage.flatMap((u) => Object.keys(u)))],
    e2e: { pass: Object.values(checks).every(Boolean), checks },
    reviewerEval: evaluation,
    error: failures.length ? failures.join(' | ') : undefined,
    aborted,
  };
}
