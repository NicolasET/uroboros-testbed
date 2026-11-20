// The implement eval as uroboros 1.0.0+ sees it: a large run resumed once its plan is CLEAN, before the first implementer.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { exec } from './exec.ts';
import { ideaInProjectFiles, recordedSize } from './flow.ts';
import { featurePath, GOAL_FEATURE, IMPLEMENT_DIR, prepareWorkspace } from './implement-eval.ts';
import type { RoleProfile } from './model-profile.ts';
import { runGate, runHiddenTestFile } from './verify.ts';

const V1 = '1.0.0';
const profile = { alias: 'opus', effort: 'medium', modelId: 'claude-opus-5-5', claudeCodeVersion: '0' } as RoleProfile;
const source = join(IMPLEMENT_DIR, 'feature-goal');
const goal = readFileSync(join(source, 'goal.md'), 'utf8');
const plan = readFileSync(join(source, 'plan.md'), 'utf8');
const criteria = [...goal.matchAll(/^- (AC-\d+):/gm)].map((m) => m[1]!);

interface Group {
  id: string;
  covers: string[];
  after: string[];
  expects: string[];
}

const groups: Group[] = [...plan.matchAll(/^- (G\d+) — (.*)$/gm)].map((m) => {
  const text = m[2]!;
  const section = (from: RegExp, to: RegExp) => (from.exec(text)?.[1] ?? '').split(to)[0] ?? '';
  return {
    id: m[1]!,
    covers: section(/Covers ([^.]*)\./, /\n/).match(/AC-\d+/g) ?? [],
    after: section(/after: ([^.]*)\./, /\n/).match(/G\d+/g) ?? [],
    expects: [...(/expects: (.*)$/.exec(text)?.[1] ?? '').matchAll(/`([^`]+)`/g)].map((f) => f[1]!),
  };
});

describe('implement eval on a goal.md feature (uroboros 1.0.0+)', () => {
  it('the plan puts every criterion in a group, and three groups that need only the first share no file', () => {
    assert.equal(criteria.length, 14);
    assert.deepEqual(groups.map((g) => g.id), ['G1', 'G2', 'G3', 'G4']);
    assert.deepEqual([...new Set(groups.flatMap((g) => g.covers))].sort(), [...criteria].sort());
    const stories = groups.slice(1);
    for (const g of stories) assert.deepEqual(g.after, ['G1'], g.id);
    for (const g of stories) assert.equal(g.expects.length, 2, `${g.id} expects ${g.expects.join(', ')}`);
    const files = stories.flatMap((g) => g.expects);
    assert.equal(new Set(files).size, files.length, 'two of the groups a wave could hold name the same file');
  });

  it('the workspace is a large run interrupted once its plan was CLEAN: branch, artifacts, state filled, marker active, user text inside .git', async () => {
    const workspace = await prepareWorkspace(V1, profile);
    const feature = join(workspace, featurePath(V1));
    for (const file of ['goal.md', 'plan.md', 'loop-state.md']) assert.ok(existsSync(join(feature, file)), file);
    assert.ok(!existsSync(join(feature, 'private-record.md')));
    assert.ok(!existsSync(join(workspace, 'specs', '001-order-lifecycle')));
    assert.equal((await exec('git', ['branch', '--show-current'], workspace)).output.trim(), `goal/${GOAL_FEATURE}`);
    const state = readFileSync(join(feature, 'loop-state.md'), 'utf8');
    assert.doesNotMatch(state, /\{\{/);
    assert.equal(recordedSize(state), 'large');
    assert.match(state, /## Phase: plan\n\nstatus: done/);
    assert.match(state, /## Phase: implement\n\n\(not started\)/);
    const record = /^PRIVATE RECORD: (.+)$/m.exec(state)?.[1];
    assert.ok(record && existsSync(record), `private record ${record}`);
    assert.match(record, /\/\.git\/uroboros\/private\/order-lifecycle\.md$/);
    const idea = /## IDEA\n\n([^\n]+)/.exec(readFileSync(record, 'utf8'))![1]!;
    assert.equal(ideaInProjectFiles(workspace, idea), undefined);
    const marker = JSON.parse(readFileSync(join(workspace, '.uroboros', 'active-run.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(marker.mode, 'goal');
    assert.equal(marker.status, 'active');
    assert.equal(marker.state_file, '.uroboros/order-lifecycle/loop-state.md');
    assert.deepEqual(await runGate(workspace), { test: true, typecheck: true, lint: true });
    const hidden = await runHiddenTestFile(workspace, join(IMPLEMENT_DIR, 'hidden-tests', 'orders.acceptance.test.ts'));
    assert.equal(hidden.total, 14, hidden.error ?? '');
    assert.equal(hidden.passed, 0);
  });

  it("the plan's contract holds every error code the hidden tests assert", () => {
    const hidden = readFileSync(join(IMPLEMENT_DIR, 'hidden-tests', 'orders.acceptance.test.ts'), 'utf8');
    const codes = new Set([...hidden.matchAll(/error: '([a-z_]+)'/g)].map((m) => m[1]!));
    codes.delete('route_not_found');
    assert.ok(codes.size >= 5);
    for (const code of codes) assert.ok(plan.includes(code), `plan.md does not hold ${code}`);
  });
});
