import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { featureDir } from './artifacts.ts';
import { privateRecordDir } from './flow.ts';
import { execOrThrow } from './exec.ts';
import { draftReady, partsToStart, resolvesDependencies, worktrees } from './parts-eval.ts';

async function repo(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'uro-testbed-parts-'));
  writeFileSync(join(dir, 'a.txt'), 'a');
  await execOrThrow('git', ['init', '--quiet', '--initial-branch', 'main'], dir);
  await execOrThrow('git', ['config', 'user.email', 'testbed@uroboros.local'], dir);
  await execOrThrow('git', ['config', 'user.name', 'uroboros testbed'], dir);
  await execOrThrow('git', ['add', '-A'], dir);
  await execOrThrow('git', ['commit', '--quiet', '-m', 'base'], dir);
  return dir;
}

function writeDraft(dir: string, slug: string, text: string): void {
  mkdirSync(join(dir, '.uroboros', 'parts', slug), { recursive: true });
  writeFileSync(join(dir, '.uroboros', 'parts', slug, 'intake.md'), text);
}

describe('parts eval', () => {
  it('a draft is ready only once intake is confirmed and it says where the user text is', () => {
    assert.equal(draftReady('PART: startup — the startup line\nINTAKE: confirmed\nPRIVATE RECORD: /w/.git/uroboros/private/x.md'), true);
    assert.equal(draftReady('PART: startup\nINTAKE: confirmed'), false);
    assert.equal(draftReady('PART: startup\nPRIVATE RECORD: /w/.git/uroboros/private/x.md'), false);
  });

  it('starts a part when its worktree exists and its draft is ready, and no other', async () => {
    const dir = await repo();
    const ready = 'INTAKE: confirmed\nPRIVATE RECORD: /x.md';
    writeDraft(dir, 'startup-message', ready);
    writeDraft(dir, 'no-worktree-yet', ready);
    writeDraft(dir, 'draft-not-finished', 'INTAKE: confirmed');
    assert.equal((await partsToStart(await repo())).size, 0, 'a checkout with no drafts folder, as after the joint report');
    assert.equal((await partsToStart(dir)).size, 0);
    await execOrThrow('git', ['worktree', 'add', '--quiet', '-b', 'startup-message', '.claude/worktrees/startup-message', 'HEAD'], dir);
    await execOrThrow('git', ['worktree', 'add', '--quiet', '-b', 'draft-not-finished', '.claude/worktrees/draft-not-finished', 'HEAD'], dir);
    assert.deepEqual([...(await worktrees(dir)).keys()].sort(), ['draft-not-finished', 'startup-message']);
    const parts = await partsToStart(dir);
    assert.deepEqual([...parts.keys()], ['startup-message']);
    assert.equal(parts.get('startup-message')!.worktree, resolve(dir, '.claude', 'worktrees', 'startup-message'));
    // A worktree's `.git` is a file: what the user typed is in the repository's shared `.git`, for the main checkout and the part alike.
    const shared = resolve(dir, '.git', 'uroboros', 'private');
    assert.equal(resolve(privateRecordDir(dir)), shared);
    assert.equal(resolve(privateRecordDir(parts.get('startup-message')!.worktree)), shared);
    // A worktree inside the main checkout finds the dependencies installed there.
    assert.equal(resolvesDependencies(parts.get('startup-message')!.worktree), false);
    mkdirSync(join(dir, 'node_modules'));
    assert.equal(resolvesDependencies(parts.get('startup-message')!.worktree), true);
  });

  it("the drafts' folder is never taken for the run's feature", () => {
    const dir = mkdtempSync(join(tmpdir(), 'uro-testbed-parts-feature-'));
    mkdirSync(join(dir, '.uroboros', 'parts', 'startup-message'), { recursive: true });
    assert.equal(featureDir(dir, '.uroboros'), undefined);
    mkdirSync(join(dir, '.uroboros', 'price-filter'));
    assert.equal(featureDir(dir, '.uroboros'), join(dir, '.uroboros', 'price-filter'));
  });
});
