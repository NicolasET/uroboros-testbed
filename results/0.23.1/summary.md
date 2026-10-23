# uroboros 0.23.1

- uroboros: v0.23.1 → 0.23.1 @ 87f4d84
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v7 · verifier eval: v2 · reviewer eval: v2 · started: 2026-10-23T18:08:26.493Z
- compared with: compat → 0.23.0; review → 0.16.1

### compat

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 0.28 | 0.26 |
| duration (min) | 1.2 | 1.1 |
| output tokens | 2856 | 2289 |

### review

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 2/3 · weakened 3/3 · extra 3/3 · deleted 2/3 · ranking 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 |
| reviewer on the clean copy | CLEAN 3/3 runs · findings 0 · risks 0 | CLEAN 3/3 runs · findings 0 · risks 0 |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 8.72 | 7.60 |
| duration (min) | 32.9 | 29.0 |
| output tokens | 135229 | 104322 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
- Modes not measured in this result: default, auto, goal, verify.
