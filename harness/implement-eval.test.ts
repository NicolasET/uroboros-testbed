import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { everyTaskChecked } from './checks.ts';
import { FIXTURE_DIR } from './config.ts';
import { execOrThrow } from './exec.ts';
import { FEATURE, fillState, IMPLEMENT_DIR, prepareWorkspace, promptFor, variantsFor, wavesSection } from './implement-eval.ts';
import type { RoleProfile } from './model-profile.ts';
import { runGate, runHiddenTestFile } from './verify.ts';

const profile: RoleProfile = { alias: 'opus', modelId: 'claude-opus-5-5', effort: 'medium', claudeCodeVersion: 'x' };
const HIDDEN = join(IMPLEMENT_DIR, 'hidden-tests', 'orders.acceptance.test.ts');
const read = (dir: string, file: string) => readFileSync(join(dir, file), 'utf8');

describe('implement eval hidden tests', () => {
  it('all fail on the workspace a run resumes, so none passes without the feature', async () => {
    const result = await runHiddenTestFile(await prepareWorkspace('0.25.0', profile), HIDDEN);
    assert.equal(result.total, 14, result.error ?? '');
    assert.equal(result.passed, 0);
    assert.deepEqual(Object.keys(result.groups).map((g) => g.split(':')[0]), ['routes', 'US1', 'US2', 'US3']);
  });

  it('all pass on the reference implementation, with a green gate', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'uro-testbed-implement-'));
    cpSync(FIXTURE_DIR, workspace, { recursive: true });
    cpSync(join(IMPLEMENT_DIR, 'reference', 'src'), join(workspace, 'src'), { recursive: true });
    const hidden = await runHiddenTestFile(workspace, HIDDEN);
    assert.equal(hidden.passed, 14, JSON.stringify(hidden.groups));
    assert.deepEqual(await runGate(workspace), { test: true, typecheck: true, lint: true });
  });
});

describe('implement eval workspace', () => {
  it('is a run interrupted after analyze: feature branch, artifacts uncommitted, state filled, marker active, gate green', async () => {
    const workspace = await prepareWorkspace('0.25.0', profile);
    const base = await execOrThrow('git', ['rev-parse', 'main'], workspace);
    assert.equal(await execOrThrow('git', ['branch', '--show-current'], workspace), FEATURE);
    assert.equal(await execOrThrow('git', ['rev-parse', 'HEAD'], workspace), base);
    assert.match(await execOrThrow('git', ['status', '--porcelain'], workspace), new RegExp(`\\?\\? specs/`));
    assert.deepEqual(JSON.parse(read(workspace, '.specify/feature.json')), { feature_directory: `specs/${FEATURE}` });
    const state = read(workspace, `specs/${FEATURE}/loop-state.md`);
    assert.doesNotMatch(state, /\{\{/);
    assert.match(state, new RegExp(`\nBASE BRANCH: main @ ${base}\n`));
    assert.match(state, /\nUROBOROS: 0\.25\.0\n/);
    assert.match(state, /\n--reviewer=opus:medium --implementer=opus:medium \(no --auto/);
    assert.match(state, /### analyze\nstatus: done/);
    assert.match(state, /### implement\n\(not started\)\n$/);
    const marker = JSON.parse(read(workspace, '.uroboros/active-run.json')) as { session_id: string; status: string; state_file: string };
    assert.equal(marker.status, 'active');
    assert.equal(marker.session_id, /^SESSION: (\S+)$/m.exec(state)?.[1]);
    assert.ok(existsSync(join(workspace, marker.state_file)));
    assert.equal(everyTaskChecked(read(workspace, `specs/${FEATURE}/tasks.md`)), false);
    assert.deepEqual(await runGate(workspace), { test: true, typecheck: true, lint: true });
  });

  it('fills every placeholder of the state file or refuses', () => {
    assert.equal(fillState('a {{X}} b {{X}}', { X: '1' }), 'a 1 b 1');
    assert.throws(() => fillState('{{Y}}', { X: '1' }), /\{\{Y\}\}/);
  });
});

describe('implement eval tasks.md', () => {
  const tasks = read(join(IMPLEMENT_DIR, 'feature'), 'tasks.md');
  /** The files each user-story phase's tasks name: what uroboros 0.25.0 groups a story by (implement protocol, Waves). */
  const storyFiles = (): Record<string, string[]> => {
    const files: Record<string, string[]> = {};
    let story: string | undefined;
    for (const line of tasks.split('\n')) {
      if (line.startsWith('## ')) story = /^## Phase \d+: User Story (\d+)/.exec(line)?.[1];
      else if (story && /^- \[ \] T\d+/.test(line)) files[`US${story}`] = [...new Set([...(files[`US${story}`] ?? []), ...(line.match(/[\w./-]+\.(?:ts|js|json|md|ya?ml)\b/g) ?? [])])];
    }
    return files;
  };

  it('gives each user story its own source module and test file, and no other file', () => {
    assert.deepEqual(storyFiles(), {
      US1: ['test/order-cancel.test.ts', 'src/order-cancel.ts'],
      US2: ['test/order-fulfill.test.ts', 'src/order-fulfill.ts'],
      US3: ['test/order-detail.test.ts', 'src/order-detail.ts'],
    });
  });

  it('says in Dependencies & Execution Order that the stories are independent', () => {
    const section = tasks.slice(tasks.indexOf('## Dependencies & Execution Order'));
    assert.match(section, /do not depend on each other and share no file/);
  });

  it('starts with every task unchecked', () => {
    assert.match(tasks, /- \[ \] T001 /);
    assert.doesNotMatch(tasks, /- \[[xX]\]/);
  });
});

describe('implement eval variants and prompt', () => {
  it('runs one variant before 0.25.0 and the default and --parallel=3 from it', () => {
    assert.deepEqual(variantsFor('0.24.0'), [{ name: 'single', flags: [] }]);
    assert.deepEqual(variantsFor('0.25.0'), [
      { name: 'default', flags: [] },
      { name: 'parallel=3', flags: ['--parallel=3'] },
    ]);
  });

  it('resumes with no idea and the role model for the reviewer and the implementer', () => {
    const [byDefault, parallel] = variantsFor('0.25.0');
    assert.equal(promptFor(profile, byDefault!), '/uroboros:run --reviewer=opus:medium --implementer=opus:medium');
    assert.equal(promptFor(profile, parallel!), '/uroboros:run --reviewer=opus:medium --implementer=opus:medium --parallel=3');
  });
});

describe('implement eval waves', () => {
  it('reads the body of the ### Waves section up to the next heading', () => {
    const state = '### Gate touched\n- r1: none\n### Waves\n\n- wave 1: US1 (T004, T005), US2 (T006, T007)\n- after: T010\n### Red first\n- r1: x\n';
    assert.equal(wavesSection(state), '- wave 1: US1 (T004, T005), US2 (T006, T007)\n- after: T010');
    assert.equal(wavesSection('### Waves\n- none\n'), '- none');
    assert.equal(wavesSection('### Gate touched\n- r1: none\n'), undefined);
  });
});
