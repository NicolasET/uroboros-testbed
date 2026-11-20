// The reviewer eval as uroboros 1.0.0+ sees it: the fixed feature is a goal.md, and what the user typed sits inside .git.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { ideaInProjectFiles } from './flow.ts';
import type { RoleProfile } from './model-profile.ts';
import { featurePath, prepareWorkspace, readReviewCases, refuterPrompt, REVIEW_DIR, stepBPrompt, UNKNOWN_FROM, type StepBInput } from './review-eval.ts';

const V1 = '1.0.0';
const profile = { alias: 'opus', effort: 'medium', modelId: 'claude-opus-5-5', claudeCodeVersion: '0' } as RoleProfile;
const clean = readReviewCases().find((c) => c.name === 'clean')!;
const gate = { test: true, typecheck: true, lint: true };

function inputFor(workspace: string, version: string, extra: Partial<StepBInput> = {}): StepBInput {
  return { workspace, pluginDir: '/plugin', version, profile, changed: ['src/app.ts'], diffStat: ' src/app.ts | 2 +-', gate, runDiff: '/w/.git/uroboros/run.diff', ...extra };
}

describe('reviewer eval on a goal.md feature (uroboros 1.0.0+)', () => {
  it('lays the feature under .uroboros/, keeps what the user typed inside .git, and records both in the state file', async () => {
    const { workspace, trees } = await prepareWorkspace(clean, V1);
    const feature = join(workspace, featurePath(V1));
    assert.ok(existsSync(join(feature, 'goal.md')));
    assert.ok(!existsSync(join(workspace, 'specs', '001-pause-listing')));
    assert.ok(!existsSync(join(feature, 'private-record.md')), 'the private record must not be copied into the working tree');
    assert.ok(trees?.privateRecord && existsSync(trees.privateRecord));
    assert.match(trees.privateRecord.replace(/\\/g, '/'), /\/\.git\/uroboros\/private\/pause-listing\.md$/);
    const idea = /## IDEA\n\n([^\n]+)/.exec(readFileSync(join(REVIEW_DIR, 'feature-goal', 'private-record.md'), 'utf8'))![1]!;
    assert.equal(ideaInProjectFiles(workspace, idea), undefined);
    const state = readFileSync(join(feature, 'loop-state.md'), 'utf8');
    assert.match(state, /- BASE TREE: [0-9a-f]{40}/);
    assert.match(state, /- ROUND TREE 1: [0-9a-f]{40}/);
    assert.match(state, /one dispatch got every criterion/);
    assert.match(state, /- JUDGING SOURCES: \.uroboros\/ specs\//);
    assert.doesNotMatch(state, /\.specify|speckit/);
    assert.match(state, /- PRIVATE RECORD: .*pause-listing\.md/);
    assert.equal((state.match(/^## SURFACES$/gm) ?? []).length, 1);
    assert.doesNotMatch(state, /^SURFACES: /m);
  });

  it('step B passes the private record and goal.md, and none of the spec-kit inputs', () => {
    const prompt = stepBPrompt(inputFor('/w', V1, { privateRecord: '/w/.git/uroboros/private/pause-listing.md' }));
    for (const line of ['PHASE: implement', 'ROUND: 1', 'RUN_MODE: default', 'PRIVATE_RECORD: /w/.git/uroboros/private/pause-listing.md', 'RUN_DIFF: /w/.git/uroboros/run.diff', 'GATE RESULT: pass']) assert.ok(prompt.includes(line), line);
    assert.match(prompt, /GOAL_FILE: .*goal\.md/);
    assert.match(prompt, /- D6 /);
    assert.doesNotMatch(prompt, /FEATURE_DIR|ARTIFACTS|spec\.md|tasks\.md/);
    assert.throws(() => stepBPrompt(inputFor('/w', V1)), /PRIVATE_RECORD/);
  });

  it('a version before 1.0.0 keeps its own step B', () => {
    const prompt = stepBPrompt(inputFor('/w', '0.32.0'));
    assert.match(prompt, /FEATURE_DIR: /);
    assert.doesNotMatch(prompt, /PRIVATE_RECORD|GOAL_FILE/);
  });

  it("step C's refuter gets step B's inputs but ROUND and the instruction line", () => {
    const prompt = refuterPrompt(inputFor('/w', V1, { privateRecord: '/p.md' }), [{ id: 'F1', weight: 'decision', derived: false, text: '  - id: F1\n    weight: decision' }]);
    assert.match(prompt, /refuter-instructions\.md/);
    assert.match(prompt, /PRIVATE_RECORD: \/p\.md/);
    assert.match(prompt, /FINDINGS:\n {2}- id: F1/);
    assert.doesNotMatch(prompt, /ROUND: 1|Read the state file first/);
  });

  it('is not built for a version whose step B nobody has read yet', () => {
    assert.throws(() => stepBPrompt(inputFor('/w', UNKNOWN_FROM, { privateRecord: '/p.md' })));
  });
});
