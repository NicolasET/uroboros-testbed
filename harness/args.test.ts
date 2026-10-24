import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseArgs } from './args.ts';

describe('run arguments', () => {
  it('measures every mode but the implement eval when no mode is named', () => {
    assert.deepEqual(parseArgs(['--uroboros', 'v0.24.0']).modes, ['default', 'auto', 'goal', 'compat', 'verify', 'review']);
  });

  it('runs the implement eval when it is named, and refuses an unknown mode', () => {
    assert.deepEqual(parseArgs(['--modes', 'implement']).modes, ['implement']);
    assert.throws(() => parseArgs(['--modes', 'fast']), /unknown mode/);
  });
});
