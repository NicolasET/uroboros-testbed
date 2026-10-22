import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { FIXTURE_DIR } from './config.ts';
import { execOrThrow } from './exec.ts';
import type { RoleProfile } from './model-profile.ts';
import { buildReviewCase, changedFiles, copyFeature, isCatch, parseReview, prepareWorkspace, readReviewCases, reviewerGuide, stepBPrompt, type ReviewCase } from './review-eval.ts';
import { runGate, runHiddenTests } from './verify.ts';

const caseNamed = (name: string) => readReviewCases().find((c) => c.name === name)!;

function caseWorkspace(c: ReviewCase): string {
  const dir = mkdtempSync(join(tmpdir(), `uro-testbed-review-${c.name}-`));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  copyFeature(dir);
  buildReviewCase(dir, c);
  return dir;
}

/** The workspace the eval builds: fixture and feature artifacts committed, the change left uncommitted. */
async function gitCaseWorkspace(c: ReviewCase): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), `uro-testbed-review-git-${c.name}-`));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  copyFeature(dir);
  await execOrThrow('git', ['init', '--quiet', '--initial-branch', 'main'], dir);
  await execOrThrow('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A'], dir);
  await execOrThrow('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--quiet', '-m', 'base'], dir);
  buildReviewCase(dir, c);
  return dir;
}

const read = (dir: string, file: string) => readFileSync(join(dir, file), 'utf8');

describe('reviewer eval cases', () => {
  for (const c of readReviewCases()) {
    it(`${c.name}: the gate stays green`, async () => {
      assert.deepEqual(await runGate(caseWorkspace(c)), { test: true, typecheck: true, lint: true });
    });
  }

  it('clean: the change passes the hidden tests 11/11', async () => {
    assert.equal((await runHiddenTests(caseWorkspace(caseNamed('clean')))).passed, 11);
  });

  it('every defect case states its defect, and the clean copy none', () => {
    for (const c of readReviewCases()) assert.equal(c.defect === null, c.overlay === null, c.name);
  });

  it('each defect is in place', () => {
    assert.match(read(caseWorkspace(caseNamed('untracked')), 'src/pause-policy.ts'), /user\.role === 'seller' && listing\.status === 'active'/);
    assert.match(read(caseWorkspace(caseNamed('skip')), 'test/app.test.ts'), /it\.skip\('filters by title'/);
    assert.match(read(caseWorkspace(caseNamed('suppress')), 'src/orders.ts'), /@ts-expect-error[^\n]*\n\s*if \(user\.role === 'admn'\)/);
    const weakened = caseWorkspace(caseNamed('weakened'));
    assert.doesNotMatch(read(weakened, 'src/orders.ts'), /ORDER_RANK_BOOST/);
    assert.match(read(weakened, 'test/app.test.ts'), />= 12/);
    const extra = caseWorkspace(caseNamed('extra'));
    assert.match(read(extra, 'src/gateway.ts'), /'POST \/listings\/:id\/toggle'/);
    assert.match(read(extra, 'src/app.ts'), /parts\[2\] === 'toggle'/);
  });
});

describe('reviewer eval step-B prompt', () => {
  const profile: RoleProfile = { alias: 'opus', modelId: 'claude-opus-5-5', effort: 'medium', claudeCodeVersion: 'x' };
  const gate = { test: true, typecheck: true, lint: true };

  it('the changed-file list has untracked files from 0.16.2 only, as each version passed it', async () => {
    const workspace = await gitCaseWorkspace(caseNamed('untracked'));
    const before = await changedFiles(workspace, '0.16.1');
    const after = await changedFiles(workspace, '0.16.2');
    assert.ok(before.includes('src/listings.ts'));
    assert.ok(!before.includes('src/pause-policy.ts') && !before.includes('test/pause.test.ts'));
    assert.ok(after.includes('src/pause-policy.ts') && after.includes('test/pause.test.ts'));
  });

  it('from 0.17.0, the change is the diff between the snapshots, written where the plugin writes it and recorded in the state file', async () => {
    const { workspace, trees } = await prepareWorkspace(caseNamed('untracked'), '0.17.0');
    assert.ok(trees && trees.base !== trees.round);
    const changed = await changedFiles(workspace, '0.17.0', trees);
    assert.ok(changed.includes('src/pause-policy.ts') && changed.includes('test/pause.test.ts') && changed.includes('src/listings.ts'));
    assert.ok(!changed.some((f) => f.includes('loop-state.md')));
    assert.match(readFileSync(trees.runDiff, 'utf8'), /\+\s*return user\.role === 'admin' \|\| \(user\.role === 'seller'/);
    assert.match(trees.runDiff.replace(/\\/g, '/'), /\.git\/uroboros\/run\.diff$/);
    const state = read(workspace, 'specs/001-pause-listing/loop-state.md');
    assert.match(state, new RegExp(`BASE TREE: ${trees.base}`));
    assert.match(state, new RegExp(`ROUND TREE 1: ${trees.round}`));
    assert.doesNotMatch(state, /SURFACES:/);
    assert.match(read((await prepareWorkspace(caseNamed('clean'), '0.18.0')).workspace, 'specs/001-pause-listing/loop-state.md'), /\nSURFACES: HTTP API only/);
    assert.equal((await prepareWorkspace(caseNamed('clean'), '0.16.2')).trees, undefined);
  });

  it('is built only for the versions whose step B it reproduces', () => {
    const input = { workspace: 'w', pluginDir: 'p', profile, changed: ['a'], diffStat: 's', gate };
    assert.throws(() => stepBPrompt({ ...input, version: '0.15.0' }));
    assert.throws(() => stepBPrompt({ ...input, version: '0.17.0' }), /RUN_DIFF/);
    assert.match(stepBPrompt({ ...input, version: '0.17.0', runDiff: '/x/.git/uroboros/run.diff' }), /\nRUN_DIFF: \/x\/\.git\/uroboros\/run\.diff\n/);
    assert.throws(() => stepBPrompt({ ...input, version: '0.23.0', runDiff: 'd' }));
    const prompt = stepBPrompt({ ...input, version: '0.16.2', guide: 'GUIDE TEXT' });
    assert.match(prompt, /subagent_type `uroboros:uroboros-reviewer-medium`, model `opus`/);
    assert.match(prompt, /PHASE: implement\nROUND: 1\n/);
    assert.match(prompt, /GATE RESULT: pass/);
    assert.match(prompt, /MODEL GUIDE:\nGUIDE TEXT/);
  });

  it("pastes the Reviewer section of the guide written for the exact model, and no other", () => {
    const plugin = mkdtempSync(join(tmpdir(), 'uro-testbed-plugin-'));
    const guides = join(plugin, 'references', 'model-guides');
    mkdirSync(guides, { recursive: true });
    writeFileSync(join(guides, 'opus-5.5.md'), '---\nmodel_id: claude-opus-5-5\n---\n\n## Orchestrator\n\n- o\n\n## Reviewer\n\n- r1\n- r2\n\n## Implementer\n\n- i\n');
    assert.equal(reviewerGuide(plugin, 'claude-opus-5-5[1m]'), '- r1\n- r2');
    assert.equal(reviewerGuide(plugin, 'claude-opus-5'), undefined);
    assert.equal(existsSync(join(plugin, 'none')), false);
    assert.equal(reviewerGuide(join(plugin, 'none'), 'claude-opus-5-5'), undefined);
  });
});

describe('reviewer eval scoring', () => {
  it('reads the status and counts findings and risks', () => {
    const report = ['LOOP-REVIEW-FINDINGS', 'phase: implement', 'status: FINDINGS', 'findings:', '  - id: F1', '    location: a', '  - id: F2', 'risks:', '  - id: R1'].join('\n');
    assert.deepEqual(parseReview(report), { reported: true, status: 'FINDINGS', findings: 2, risks: 1 });
  });

  it('no report scores as not reported', () => {
    assert.deepEqual(parseReview(undefined), { reported: false, findings: 0, risks: 0 });
  });

  it('a report with no finding or risk catches nothing, whatever the judge says', () => {
    assert.equal(isCatch(true, { findings: 0, risks: 0 }), false);
    assert.equal(isCatch(true, { findings: 0, risks: 1 }), true);
    assert.equal(isCatch(false, { findings: 2, risks: 0 }), false);
  });
});
