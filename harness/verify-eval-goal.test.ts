// The verifier eval as uroboros 1.0.0+ sees it: the fixed feature is a goal.md whose acceptance criteria are the scenarios.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { FIXTURE_DIR } from './config.ts';
import { buildCase, caseFor, featurePath, promptFor, readCases, scoreRun, VERIFY_DIR } from './verify-eval.ts';

const V1 = '1.0.0';
const goal = readFileSync(join(VERIFY_DIR, 'feature-goal', 'goal.md'), 'utf8');
const criteria = [...goal.matchAll(/^- (AC-\d+):/gm)].map((m) => m[1]!);
const caseNamed = (name: string) => caseFor(readCases().find((c) => c.name === name)!, V1);
const report = (lines: string[]) => ['VERIFIER-REPORT', 'model: x', 'round: 1', 'results:', ...lines].join('\n');

describe('verifier eval on a goal.md feature (uroboros 1.0.0+)', () => {
  it('goal.md numbers eleven criteria, and every id a case expects is one of them', () => {
    assert.deepEqual(criteria, Array.from({ length: 11 }, (_, i) => `AC-${i + 1}`));
    for (const c of readCases()) {
      assert.ok(c.goal, `${c.name} has no goal mapping`);
      for (const id of [...c.goal.expectFail, ...(c.goal.expectProbe ?? [])]) assert.ok(criteria.includes(id), `${c.name} expects ${id}, which goal.md does not hold`);
    }
  });

  it('a case keeps its spec-kit ids before 1.0.0 and takes its criteria from it', () => {
    const cache = readCases().find((c) => c.name === 'cache')!;
    assert.deepEqual(caseFor(cache, '0.32.0').expectFail, ['QS-3', 'QS-9', 'US1/AC2', 'US2/AC2']);
    assert.deepEqual(caseFor(cache, V1).expectFail, ['AC-2', 'AC-6']);
    assert.deepEqual(caseFor(readCases().find((c) => c.name === 'clean')!, V1).expectFail, []);
  });

  it('the workspace holds the feature as .uroboros/pause-listing/goal.md and no spec-kit feature', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uro-testbed-verify-goal-'));
    cpSync(FIXTURE_DIR, dir, { recursive: true });
    buildCase(dir, caseNamed('clean'), V1);
    assert.ok(existsSync(join(dir, featurePath(V1), 'goal.md')));
    assert.ok(existsSync(join(dir, featurePath(V1), 'loop-state.md')));
    assert.ok(!existsSync(join(dir, 'specs', '001-pause-listing')));
  });

  it('the dispatch names GOAL_FILE and carries neither a mode nor the spec-kit files', () => {
    const prompt = promptFor('/w', '/plugin', { alias: 'opus', effort: 'medium' } as Parameters<typeof promptFor>[2], 'src/server.ts', V1, 'abc');
    assert.match(prompt, /GOAL_FILE: .*goal\.md/);
    assert.match(prompt, /- D6 /);
    assert.doesNotMatch(prompt, /MODE:|SCENARIOS_FROM|spec\.md|quickstart\.md/);
    const before = promptFor('/w', '/plugin', { alias: 'opus', effort: 'medium' } as Parameters<typeof promptFor>[2], 'src/server.ts', '0.32.0', 'abc');
    assert.match(before, /MODE: sdd/);
    assert.doesNotMatch(before, /GOAL_FILE/);
  });

  it('a fail on a criterion the defect breaks is a catch; one elsewhere is a stray failure', () => {
    const text = report(['  - id: AC-1', '    outcome: fail', '  - id: AC-2', '    outcome: fail', '  - id: AC-6', '    outcome: pass', '  - id: AC-4', '    outcome: not-run']);
    assert.deepEqual(scoreRun(text, caseNamed('cache')), { reported: true, caught: true, strayFails: 1, notRun: 1, probeFails: 0, open: 0 });
  });

  it('AC-1 is never read as AC-10 or AC-11', () => {
    assert.equal(scoreRun(report(['  - id: AC-1', '    outcome: fail']), caseNamed('edge')).caught, false);
    assert.equal(scoreRun(report(['  - id: AC-10', '    outcome: fail']), caseNamed('edge')).caught, true);
    const probe = report(['  - id: AC-1', '    outcome: pass', 'probes:', '  - id: P1', '    source: AC-1 — goal.md:10', '    kind: property', '    outcome: fail']);
    assert.equal(scoreRun(probe, caseNamed('rank')).caught, false);
  });

  it('a property probe that fails on the rank criterion is a catch by a property', () => {
    const text = report(['  - id: AC-11', '    outcome: pass', 'probes:', '  - id: P3', '    source: AC-11 — goal.md:20', '    kind: property', '    outcome: fail']);
    assert.deepEqual(scoreRun(text, caseNamed('rank')), { reported: true, caught: true, caughtByProperty: true, strayFails: 0, notRun: 0, probeFails: 1, open: 0 });
  });

  it('every fail on the clean copy is a stray failure', () => {
    assert.deepEqual(scoreRun(report(['  - id: AC-3', '    outcome: fail']), caseNamed('clean')), { reported: true, caught: undefined, strayFails: 1, notRun: 0, probeFails: 0, open: 0 });
  });
});
