import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
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
  /** Per `describe` block: "core: …", "P1: …" … "P5: …". */
  groups: Record<string, { passed: number; total: number }>;
  /** Set when the file could not run at all (e.g. the helpers it imports changed). */
  error?: string;
}

const HIDDEN_FILE = 'pause.acceptance.test.ts';
const HIDDEN_COPY = 'zz-hidden-pause.acceptance.test.ts';

/** The fixture's own gate, exactly as uroboros is expected to run it. */
export async function runGate(workspace: string): Promise<GateResult> {
  const ok = async (script: string) => (await exec('npm', ['run', '-s', script], workspace)).code === 0;
  return { test: await ok('test'), typecheck: await ok('typecheck'), lint: await ok('lint') };
}

/** Copies the hidden acceptance tests in after the run and scores them per group. */
export async function runHiddenTests(workspace: string): Promise<HiddenTestsResult> {
  copyFileSync(join(SCENARIO_DIR, 'hidden-tests', HIDDEN_FILE), join(workspace, 'test', HIDDEN_COPY));
  const { output } = await exec('npx', ['tsx', '--test', '--test-reporter=tap', `test/${HIDDEN_COPY}`], workspace);
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
