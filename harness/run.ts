// Entry point: npm run testbed -- --uroboros <path|tag|branch> [--modes default,auto,goal,compat]
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from './args.ts';
import { checkEndToEnd } from './checks.ts';
import { MODES, RESULTS_DIR, ROOT, RUNS_DIR, SCENARIO_DIR, SCENARIO_VERSION, type Mode } from './config.ts';
import { judgeAmbiguities } from './judge.ts';
import { resolveRoleProfile, type RoleProfile } from './model-profile.ts';
import { Oracle, type OracleExchange } from './oracle.ts';
import { previousResult, renderSummary } from './report.ts';
import { sumTokens, type ModeResult, type RunResult } from './results.ts';
import { runSession } from './session.ts';
import { resolveUroboros } from './uroboros-source.ts';
import { runGate, runHiddenTests } from './verify.ts';
import { createWorkspace } from './workspace.ts';

function promptFor(mode: Mode, profile: RoleProfile, idea: string): string {
  const models = `--reviewer=${profile.alias}:${profile.effort} --implementer=${profile.alias}:${profile.effort}`;
  switch (mode) {
    case 'default':
      return `/uroboros:run ${models} ${idea}`;
    case 'auto':
      return `/uroboros:run --auto ${models} ${idea}`;
    case 'goal':
      return `/uroboros:run --goal ${models} ${idea}`;
    case 'compat':
      return '/uroboros:compat';
  }
}

function readExchanges(logPath: string, mode: Mode): OracleExchange[] {
  if (!existsSync(logPath)) return [];
  return readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OracleExchange)
    .filter((x) => x.mode === mode);
}

async function runMode(mode: Mode, runDir: string, pluginDir: string, profile: RoleProfile, oracle: Oracle, oracleLog: string): Promise<ModeResult> {
  const startedAt = new Date().toISOString();
  const idea = readFileSync(join(SCENARIO_DIR, 'idea.md'), 'utf8').trim();
  const workspace = await createWorkspace(mode);
  mkdirSync(join(runDir, mode), { recursive: true });
  const askedBefore = oracle.asked;
  const oracleCostBefore = oracle.costUsd;

  console.log(`[${mode}] running in ${workspace}`);
  const session = await runSession({
    mode,
    cwd: workspace,
    prompt: promptFor(mode, profile, idea),
    pluginDir,
    profile,
    oracle,
    transcriptPath: join(runDir, mode, 'transcript.jsonl'),
  });

  const buildsCode = mode !== 'compat';
  const gate = buildsCode ? await runGate(workspace) : undefined;
  const hidden = buildsCode ? await runHiddenTests(workspace) : undefined;
  const questionsAsked = oracle.asked - askedBefore;
  const e2e = await checkEndToEnd({ mode, workspace, session, questionsAsked, gate });
  const ambiguity = buildsCode ? await judgeAmbiguities(mode, workspace, readExchanges(oracleLog, mode)) : undefined;

  return {
    mode,
    startedAt,
    durationMs: session.durationMs,
    costUsd: session.costUsd,
    harnessCostUsd: oracle.costUsd - oracleCostBefore + (ambiguity?.judgeCostUsd ?? 0),
    tokens: sumTokens(session.modelUsage),
    models: Object.keys(session.modelUsage),
    questionsAsked,
    e2e,
    gate,
    hidden,
    ambiguity,
    error: session.error,
  };
}

/** Keeps the committed log's lines for modes this run did not touch, then adds this run's lines. */
function appendOracleLog(runLog: string, resultLog: string, modesRun: Mode[]): void {
  const kept = existsSync(resultLog)
    ? readFileSync(resultLog, 'utf8').split('\n').filter((line) => line && !modesRun.includes((JSON.parse(line) as OracleExchange).mode))
    : [];
  const fresh = readFileSync(runLog, 'utf8').split('\n').filter(Boolean);
  writeFileSync(resultLog, [...kept, ...fresh].join('\n') + '\n');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  mkdirSync(RUNS_DIR, { recursive: true });

  const uroboros = await resolveUroboros(args.uroboros, RUNS_DIR);
  const runDir = join(RUNS_DIR, `${uroboros.label}-${stamp}`);
  mkdirSync(runDir, { recursive: true });
  const profile = await resolveRoleProfile();
  console.log(`uroboros ${uroboros.label} · ${profile.modelId} at ${profile.effort} · modes: ${args.modes.join(', ')}`);

  const oracleLog = join(runDir, 'oracle-log.jsonl');
  const oracle = new Oracle(readFileSync(join(SCENARIO_DIR, 'truth.md'), 'utf8'), oracleLog);
  // The SDK does not export its package.json, so read it from disk.
  const sdkManifest = join(ROOT, 'node_modules', '@anthropic-ai', 'claude-agent-sdk', 'package.json');
  const sdkVersion = (JSON.parse(readFileSync(sdkManifest, 'utf8')) as { version: string }).version;
  const { dir: _dir, ...source } = uroboros;
  const run: RunResult = { label: uroboros.label, scenarioVersion: SCENARIO_VERSION, uroboros: source, profile, sdkVersion, startedAt: new Date().toISOString(), modes: [] };

  const resultDir = join(RESULTS_DIR, uroboros.label);
  mkdirSync(resultDir, { recursive: true });
  const metricsPath = join(resultDir, 'metrics.json');
  // A partial run (--modes) replaces only the modes it ran; earlier modes of the same version and scenario stay.
  const earlier = existsSync(metricsPath) ? (JSON.parse(readFileSync(metricsPath, 'utf8')) as RunResult) : undefined;
  if (earlier?.scenarioVersion === SCENARIO_VERSION) run.modes = earlier.modes.filter((m) => !args.modes.includes(m.mode));
  const previous = previousResult(run);
  for (const mode of args.modes) {
    run.modes.push(await runMode(mode, runDir, uroboros.dir, profile, oracle, oracleLog));
    run.modes.sort((a, b) => MODES.indexOf(a.mode) - MODES.indexOf(b.mode));
    // Written after every mode so an interrupted run keeps what it measured.
    writeFileSync(metricsPath, JSON.stringify(run, null, 2) + '\n');
    if (existsSync(oracleLog)) appendOracleLog(oracleLog, join(resultDir, 'oracle-log.jsonl'), args.modes);
    writeFileSync(join(resultDir, 'summary.md'), renderSummary(run, previous));
  }
  console.log(`\n${renderSummary(run, previous)}\nresults: ${resultDir}\ntranscripts: ${runDir}`);
}

await main();
