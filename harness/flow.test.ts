import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { featureRoot } from './artifacts.ts';
import { isSingleFlow } from './checks.ts';
import { dispatches, ideaInProjectFiles, readFlow, recordedSize } from './flow.ts';

const assistant = (subagentType: string, prompt: string): string =>
  JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Agent', input: { subagent_type: subagentType, prompt } }] } });

function workspace(): string {
  return mkdtempSync(join(tmpdir(), 'uro-testbed-flow-'));
}

describe('the shape of a single-flow run', () => {
  it('reads the roles a session dispatched, telling the refuter from the reviewer by its instructions file', () => {
    const dir = workspace();
    const transcript = join(dir, 'transcript.jsonl');
    writeFileSync(
      transcript,
      [
        assistant('uroboros:uroboros-reviewer', 'INSTRUCTIONS: /p/references/refuter-instructions.md\nPHASE: intake'),
        assistant('uroboros:uroboros-reviewer', 'INSTRUCTIONS: /p/references/reviewer-instructions.md\nPHASE: goal\nROUND: 1'),
        assistant('uroboros:uroboros-implementer', 'INSTRUCTIONS: /p/references/implementer-instructions.md'),
        assistant('uroboros:uroboros-reviewer', 'INSTRUCTIONS: /p/references/reviewer-instructions.md\nPHASE: `implement`'),
        assistant('uroboros:uroboros-verifier', 'INSTRUCTIONS: /p/references/verifier-instructions.md'),
        JSON.stringify({ type: 'user', message: { content: 'uroboros-reviewer mentioned in a result, not a dispatch' } }),
      ].join('\n'),
    );
    assert.deepEqual(dispatches(transcript).map((d) => d.role), ['refuter', 'reviewer', 'implementer', 'reviewer', 'verifier']);
    const flow = readFlow(dir, transcript);
    assert.deepEqual(flow.dispatches, { implementer: 1, reviewer: 2, refuter: 1, verifier: 1 });
    assert.deepEqual(flow.reviewPhases, ['goal', 'implement']);
    assert.equal(flow.goalReviewedBeforeCode, true);
    assert.equal(flow.planWritten, false);
    assert.equal(flow.privateRecordInGit, false);
  });

  it('sees no review of goal.md before code when the first review comes after the implementer (a small run)', () => {
    const dir = workspace();
    const transcript = join(dir, 'transcript.jsonl');
    writeFileSync(transcript, [assistant('uroboros:uroboros-implementer', 'x'), assistant('uroboros:uroboros-reviewer', 'PHASE: implement\nGOAL_REVIEW: pending')].join('\n'));
    assert.equal(readFlow(dir, transcript).goalReviewedBeforeCode, false);
  });

  it('takes the last size the state file records, and none when it records none', () => {
    assert.equal(recordedSize('SIZE: small — Reach: one function (set by the run)\nSIZE: medium — Risk: a contract others consume (set by the user)'), 'medium');
    assert.equal(recordedSize('The size is small.'), undefined);
  });

  it('finds the plan, the private record inside .git and the idea left as typed in a project file', () => {
    const dir = workspace();
    const feature = join(dir, '.uroboros', 'pause-listing');
    mkdirSync(feature, { recursive: true });
    mkdirSync(join(dir, '.git', 'uroboros', 'private'), { recursive: true });
    const idea = 'Quiero que los vendedores puedan pausar una publicación sin perder su ranking, y reanudarla después.';
    writeFileSync(join(feature, 'plan.md'), '# Plan');
    writeFileSync(join(feature, 'loop-state.md'), 'IDEA ITEMS:\n- I1: sellers can pause a listing');
    writeFileSync(join(dir, '.git', 'uroboros', 'private', 'pause-listing.md'), idea);
    const flow = readFlow(dir, join(dir, 'missing.jsonl'));
    assert.equal(flow.planWritten, true);
    assert.equal(flow.privateRecordInGit, true);
    assert.equal(ideaInProjectFiles(dir, idea), undefined);
    // Wrapped differently, it is still the idea as typed.
    writeFileSync(join(feature, 'loop-state.md'), 'IDEA:\n' + idea.replace(' pausar ', '\n  pausar '));
    assert.equal(ideaInProjectFiles(dir, idea), join(feature, 'loop-state.md'));
  });

  it('places a run by its version: spec-kit artifacts before 1.0.0, .uroboros from it, and goal mode always', () => {
    assert.equal(featureRoot('default', '0.32.0'), 'specs');
    assert.equal(featureRoot('goal', '0.32.0'), '.uroboros');
    assert.equal(featureRoot('default', '1.0.0'), '.uroboros');
    assert.equal(isSingleFlow('default', '0.32.0'), false);
    assert.equal(isSingleFlow('auto', '1.0.0'), true);
    assert.equal(isSingleFlow('small', '1.2.0'), true);
    assert.equal(isSingleFlow('goal', '1.0.0'), false);
  });
});
