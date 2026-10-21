import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseVerifierReport, scoreVerifier } from './verifier.ts';

const report = (outcomes: string[]) =>
  ['VERIFIER-REPORT', 'mode: sdd', 'model: claude-opus-5-5', 'results:', ...outcomes.flatMap((o, i) => [`  - id: QS-${i + 1}`, `    outcome: ${o}`])].join('\n');

function transcript(lines: unknown[]): string {
  const path = join(mkdtempSync(join(tmpdir(), 'uro-testbed-verifier-')), 'transcript.jsonl');
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return path;
}

const notification = (summary: string) => ({ type: 'system', subtype: 'task_notification', summary });

describe('verifier score', () => {
  it('reads a report inside a fence of three or more backticks', () => {
    const fenced = (fence: string, outcome: string) => notification(`${fence}\n${report([outcome])}\n${fence}`);
    const score = scoreVerifier(transcript([fenced('```', 'pass'), fenced('````', 'fail')]));
    assert.deepEqual(score?.rounds, [{ pass: 1, fail: 0, notRun: 0 }, { pass: 0, fail: 1, notRun: 0 }]);
  });

  it('counts outcomes per report', () => {
    assert.deepEqual(parseVerifierReport(report(['pass', 'fail', 'not-run', 'pass'])), { pass: 2, fail: 1, notRun: 1 });
  });

  it('marks a failure fixed in a later round as caught', () => {
    const score = scoreVerifier(transcript([notification(report(['pass', 'fail'])), notification(report(['pass', 'pass']))]));
    assert.deepEqual(score, { rounds: [{ pass: 1, fail: 1, notRun: 0 }, { pass: 2, fail: 0, notRun: 0 }], caught: true });
  });

  it('ignores the contract template and anything that is not a task notification', () => {
    const template = 'VERIFIER-REPORT\nmode: <sdd | goal>\n    outcome: <pass | fail | not-run>';
    const score = scoreVerifier(transcript([{ type: 'user', message: template }, notification('LOOP-REVIEW-FINDINGS\nstatus: CLEAN'), notification(report(['pass']))]));
    assert.deepEqual(score, { rounds: [{ pass: 1, fail: 0, notRun: 0 }], caught: false });
  });

  it('reads a report wrapped in a code fence', () => {
    const score = scoreVerifier(transcript([notification('```\n' + report(['pass', 'fail']) + '\n```')]));
    assert.deepEqual(score?.rounds, [{ pass: 1, fail: 1, notRun: 0 }]);
  });

  it('is undefined when no verifier ran', () => {
    assert.equal(scoreVerifier(transcript([notification('IMPLEMENTER-REPORT\nstatus: DONE')])), undefined);
  });
});
