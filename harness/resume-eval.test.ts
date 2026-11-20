import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSingleFlow } from './checks.ts';
import { implementerStarted } from './resume-eval.ts';

describe('resume eval', () => {
  it('cuts the first session when an implementer subagent starts, and at nothing else', () => {
    assert.equal(implementerStarted({ type: 'system', subtype: 'task_started', subagent_type: 'uroboros:uroboros-implementer', task_id: 't1' }), true);
    assert.equal(implementerStarted({ type: 'system', subtype: 'task_started', subagent_type: 'uroboros:uroboros-reviewer' }), false);
    // A shell command whose description names the implementer is not a subagent.
    assert.equal(implementerStarted({ type: 'system', subtype: 'task_started', task_type: 'local_bash', description: 'snapshot before the uroboros-implementer dispatch' }), false);
    assert.equal(implementerStarted({ type: 'system', subtype: 'task_notification', subagent_type: 'uroboros:uroboros-implementer' }), false);
    assert.equal(implementerStarted({ type: 'assistant', message: { content: [{ type: 'tool_use', input: { subagent_type: 'uroboros:uroboros-implementer' } }] } }), false);
  });

  it('is a run of the single flow', () => {
    assert.equal(isSingleFlow('resume', '1.0.0'), true);
    assert.equal(isSingleFlow('resume', '0.32.0'), false);
  });
});
