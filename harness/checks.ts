import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureDir } from './artifacts.ts';
import type { Mode } from './config.ts';
import { exec } from './exec.ts';
import { ideaInProjectFiles, recordedSize } from './flow.ts';
import type { SessionOutcome } from './session.ts';
import { atLeast, SINGLE_FLOW_FROM } from './versions.ts';
import type { GateResult } from './verify.ts';

export interface EndToEnd {
  pass: boolean;
  checks: Record<string, boolean>;
}

interface Evidence {
  mode: Mode;
  /** The uroboros version measured: from 1.0.0 every run is the single flow, whatever the mode. */
  version: string;
  /** The idea as the run received it. */
  idea: string;
  workspace: string;
  session: SessionOutcome;
  questionsAsked: number;
  gate?: GateResult;
}

/** Every task of a `tasks.md` is checked, and there is at least one. Both [X] and [x] mark a done task in markdown. */
export const everyTaskChecked = (tasks: string): boolean => /^\s*- \[[xX]\]/m.test(tasks) && !/^\s*- \[ \]/m.test(tasks);

const SINGLE_FLOW_MODES: readonly Mode[] = ['default', 'auto', 'small', 'medium', 'resume'];

/** Whether this mode of this version is a run of the single flow (uroboros 1.0.0+): `goal.md` under `.uroboros/`, no spec-kit artifact. */
export const isSingleFlow = (mode: Mode, version: string): boolean => SINGLE_FLOW_MODES.includes(mode) && atLeast(version, SINGLE_FLOW_FROM);

function markerStatus(workspace: string): string | undefined {
  const marker = join(workspace, '.uroboros', 'active-run.json');
  return existsSync(marker) ? (JSON.parse(readFileSync(marker, 'utf8')) as { status?: string }).status : undefined;
}

async function onFeatureBranch(workspace: string): Promise<boolean> {
  const branch = await exec('git', ['branch', '--show-current'], workspace);
  return branch.code === 0 && branch.output.trim() !== 'main';
}

/** Deterministic end-to-end checks per mode: did the run finish and leave what it promises? */
export async function checkEndToEnd(e: Evidence): Promise<EndToEnd> {
  const checks: Record<string, boolean> = { 'session ended without error': !e.session.error };
  const gateGreen = !!e.gate && e.gate.test && e.gate.typecheck && e.gate.lint;

  if (isSingleFlow(e.mode, e.version)) {
    const dir = featureDir(e.workspace, '.uroboros');
    const state = dir && existsSync(join(dir, 'loop-state.md')) ? readFileSync(join(dir, 'loop-state.md'), 'utf8') : '';
    checks['goal.md exists'] = !!dir && existsSync(join(dir, 'goal.md'));
    checks['loop-state.md exists'] = !!state;
    checks['size recorded'] = !!recordedSize(state);
    checks['marker closed as complete'] = markerStatus(e.workspace) === 'complete';
    checks['feature branch created'] = await onFeatureBranch(e.workspace);
    checks['gate green'] = gateGreen;
    // The report is written in the user's language, so its title varies; its first required item is the path to loop-state.md.
    checks['loop report produced'] = /loop-state\.md/.test(e.session.finalText);
    checks['the idea as typed is in no project file'] = !ideaInProjectFiles(e.workspace, e.idea);
    if (e.mode === 'auto') checks['no question after the up-front batch'] = e.questionsAsked === 0;
  } else if (e.mode === 'default' || e.mode === 'auto') {
    const dir = featureDir(e.workspace, 'specs');
    for (const file of ['spec.md', 'plan.md', 'tasks.md', 'loop-state.md']) checks[`${file} exists`] = !!dir && existsSync(join(dir, file));
    const tasks = dir && existsSync(join(dir, 'tasks.md')) ? readFileSync(join(dir, 'tasks.md'), 'utf8') : '';
    checks['every task checked'] = everyTaskChecked(tasks);
    checks['feature branch created'] = await onFeatureBranch(e.workspace);
    checks['gate green'] = gateGreen;
    // The report is written in the user's language, so its title varies; its first required item is the path to loop-state.md.
    checks['loop report produced'] = /loop-state\.md/.test(e.session.finalText);
    if (e.mode === 'auto') checks['no question after the up-front batch'] = e.questionsAsked === 0;
  }

  if (e.mode === 'goal') {
    const dir = featureDir(e.workspace, '.uroboros');
    checks['goal.md exists'] = !!dir && existsSync(join(dir, 'goal.md'));
    checks['loop-state.md exists'] = !!dir && existsSync(join(dir, 'loop-state.md'));
    checks['marker closed as complete'] = markerStatus(e.workspace) === 'complete';
    checks['gate green'] = gateGreen;
  }

  if (e.mode === 'compat') {
    const report = e.session.finalText;
    checks['report printed'] = report.includes('SPEC-KIT COMPAT REPORT');
    checks['verdict covered'] = /verdict:\s*covered\b/.test(report);
    checks['no CHANGED or MISSING row'] = !/\|\s*(CHANGED|MISSING)\s*\|/.test(report);
  }

  return { pass: Object.values(checks).every(Boolean), checks };
}
