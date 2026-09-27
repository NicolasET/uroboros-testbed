import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { featureDir } from './artifacts.ts';
import type { Mode } from './config.ts';
import { execOrThrow } from './exec.ts';
import type { SessionOutcome } from './session.ts';
import type { GateResult } from './verify.ts';

export interface EndToEnd {
  pass: boolean;
  checks: Record<string, boolean>;
}

interface Evidence {
  mode: Mode;
  workspace: string;
  session: SessionOutcome;
  questionsAsked: number;
  gate?: GateResult;
}

/** Deterministic end-to-end checks per mode: did the run finish and leave what it promises? */
export async function checkEndToEnd(e: Evidence): Promise<EndToEnd> {
  const checks: Record<string, boolean> = { 'session ended without error': !e.session.error };
  const gateGreen = !!e.gate && e.gate.test && e.gate.typecheck && e.gate.lint;

  if (e.mode === 'default' || e.mode === 'auto') {
    const dir = featureDir(e.workspace, 'specs');
    for (const file of ['spec.md', 'plan.md', 'tasks.md', 'loop-state.md']) checks[`${file} exists`] = !!dir && existsSync(join(dir, file));
    const tasks = dir && existsSync(join(dir, 'tasks.md')) ? readFileSync(join(dir, 'tasks.md'), 'utf8') : '';
    checks['every task checked'] = tasks.includes('[X]') && !/^\s*- \[ \]/m.test(tasks);
    checks['feature branch created'] = (await execOrThrow('git', ['branch', '--show-current'], e.workspace)) !== 'main';
    checks['gate green'] = gateGreen;
    checks['loop report produced'] = /loop report/i.test(e.session.finalText);
    if (e.mode === 'auto') checks['no question after the up-front batch'] = e.questionsAsked === 0;
  }

  if (e.mode === 'goal') {
    const dir = featureDir(e.workspace, '.uroboros');
    checks['goal.md exists'] = !!dir && existsSync(join(dir, 'goal.md'));
    checks['loop-state.md exists'] = !!dir && existsSync(join(dir, 'loop-state.md'));
    const marker = join(e.workspace, '.uroboros', 'active-run.json');
    const status = existsSync(marker) ? (JSON.parse(readFileSync(marker, 'utf8')) as { status?: string }).status : undefined;
    checks['marker closed as complete'] = status === 'complete';
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
