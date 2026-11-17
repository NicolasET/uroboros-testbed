# uroboros 0.30.1

- uroboros: v0.30.1 → 0.30.1 @ a7667ab
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v9 · verifier eval: v3 · reviewer eval: v3 · implement eval: v1 · started: 2026-11-17T15:58:08.995Z
- compared with: verify, review → nothing yet

### verify

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| earlier decisions the idea changes, surfaced | - |
| earlier decision the idea leaves alone, asked again | - |
| "No sé" to a list (lists · items kept) | - |
| hidden tests | - |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 · rank 3/3 |
| verifier detection by a property probe (caught / runs) | edge 0/3 · rank 0/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - |
| reviewer detection after the refuter (caught / runs) | - |
| reviewer on the clean copies | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 10.32 |
| duration (min) | 53.8 |
| output tokens | 201974 |

### review

| | this run |
|---|---|
| end to end | FAIL (every run returned a report) |
| ambiguities detected | - |
| earlier decisions the idea changes, surfaced | - |
| earlier decision the idea leaves alone, asked again | - |
| "No sé" to a list (lists · items kept) | - |
| hidden tests | - |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier detection by a property probe (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 2/3 · ranking 2/3 · rule 0/3 |
| reviewer detection after the refuter (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 2/3 · ranking 2/3 · rule 0/3 |
| reviewer on the clean copies | rule-clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 · clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 15.58 |
| duration (min) | 54.7 |
| output tokens | 182943 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- What the orchestrator does after the refuter: the reviewer eval scores the reviewer's report and, from uroboros 0.29.0, which of its items survive the refuter, but it asks no question and folds nothing.
- Modes not measured in this result: default, auto, goal, compat.
