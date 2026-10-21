# uroboros 0.16.1

- uroboros: v0.16.1 → 0.16.1 @ 516d4c6
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v1 · reviewer eval: v1 · started: 2026-10-21T02:27:02.890Z
- compared with: review → nothing yet

### review

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| hidden tests | - |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 2/3 · weakened 3/3 · extra 3/3 |
| reviewer on the clean copy | CLEAN 3/3 runs · findings 0 · risks 0 |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 6.35 |
| duration (min) | 16.2 |
| output tokens | 95983 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
- Modes not measured in this result: default, auto, goal, compat, verify.
