import { copyFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { SCENARIO_DIR } from './config.ts';
import { exec } from './exec.ts';

export interface GateResult {
  test: boolean;
  typecheck: boolean;
  lint: boolean;
}

export interface HiddenTestsResult {
  passed: number;
  total: number;
  /** Per `describe` block: "core: …", "P1: …" … "P5: …"; "runtime: …" for the runtime tests. */
  groups: Record<string, { passed: number; total: number }>;
  /** Set when the file could not run at all (e.g. the helpers it imports changed). */
  error?: string;
}

const ACCEPTANCE_FILE = 'pause.acceptance.test.ts';
const RUNTIME_FILE = 'pause.runtime.test.ts';

/** The fixture's own gate, exactly as uroboros is expected to run it. */
export async function runGate(workspace: string): Promise<GateResult> {
  const ok = async (script: string) => (await exec('npm', ['run', '-s', script], workspace)).code === 0;
  return { test: await ok('test'), typecheck: await ok('typecheck'), lint: await ok('lint') };
}

/** Copies the hidden acceptance tests in after the run and scores them per group. */
export function runHiddenTests(workspace: string): Promise<HiddenTestsResult> {
  return runHiddenTestFile(workspace, join(SCENARIO_DIR, 'hidden-tests', ACCEPTANCE_FILE));
}

/** Copies the hidden runtime tests in after the run: they start the real server, not the in-process app. */
export function runRuntimeTests(workspace: string): Promise<HiddenTestsResult> {
  return runHiddenTestFile(workspace, join(SCENARIO_DIR, 'hidden-tests', RUNTIME_FILE));
}

/** Copies a hidden test file into the workspace's `test/` after the run, runs it and scores it per group. */
export async function runHiddenTestFile(workspace: string, source: string): Promise<HiddenTestsResult> {
  const copy = `zz-hidden-${basename(source)}`;
  copyFileSync(source, join(workspace, 'test', copy));
  const { output } = await exec('npx', ['tsx', '--test', '--test-reporter=tap', `test/${copy}`], workspace);
  return parseTap(output);
}

/** Node's TAP: `# Subtest: <describe>` at column 0 opens a group; its tests are `    ok`/`    not ok` lines. */
export function parseTap(tap: string): HiddenTestsResult {
  const groups: HiddenTestsResult['groups'] = {};
  let group = '';
  for (const line of tap.split(/\r?\n/)) {
    const opened = /^# Subtest: (.+)$/.exec(line);
    if (opened?.[1]) {
      group = opened[1];
      groups[group] ??= { passed: 0, total: 0 };
      continue;
    }
    const test = /^ {4}(not ok|ok) \d+ - /.exec(line);
    const current = groups[group];
    if (test && current) {
      current.total++;
      if (test[1] === 'ok') current.passed++;
    }
  }
  const all = Object.values(groups);
  const result: HiddenTestsResult = {
    passed: all.reduce((n, g) => n + g.passed, 0),
    total: all.reduce((n, g) => n + g.total, 0),
    groups,
  };
  if (result.total === 0) result.error = tap.slice(-2000);
  return result;
}
