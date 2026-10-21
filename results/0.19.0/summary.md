# uroboros 0.19.0

- uroboros: v0.19.0 → 0.19.0 @ a2f4f47
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-21T19:53:26.899Z
- compared with: verify → nothing yet

### verify

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| hidden tests | - |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 0/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 2 |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 4.99 |
| duration (min) | 15.9 |
| output tokens | 104531 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- Modes not measured in this result: default, auto, goal, compat, review.
