import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { SCENARIO_DIR } from './config.ts';
import { userView } from './oracle.ts';

const truth = readFileSync(join(SCENARIO_DIR, 'truth.md'), 'utf8');
const facts = (text: string) => text.split('\n').filter((line) => line.startsWith('- '));

describe("the oracle's view of truth.md", () => {
  const view = userView(truth);

  it('keeps every fact', () => {
    assert.equal(facts(view).length, facts(truth).length);
    assert.match(view, /The seller who owns the listing, and admins\./);
    assert.match(view, /- \*\*S1 — Only admins change a listing's status\.\*\*/);
  });

  it('says nothing about the scoring, the file or the scenario', () => {
    // `rankScore`, "judgement" and "v1" (the feature's first version) are the user's words; scenario versions are v2 and later.
    for (const word of [/oracle/i, /\bscor(e|ed|ing)\b/i, /planted/i, /truth/i, /\bjudge\b/i, /this file/i, /scenario\//i, /harness/i, /\bP\d\b/, /SCENARIO_VERSION/, /\bv[2-9]\b/]) {
      assert.doesNotMatch(view, word, String(word));
    }
  });

  it('names its sections the way the user would', () => {
    assert.deepEqual(view.split('\n').filter((l) => l.startsWith('## ')), ['## What I want', '## Other things I know', "## The project's standing decisions"]);
  });
});
