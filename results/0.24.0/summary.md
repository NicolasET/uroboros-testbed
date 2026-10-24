# uroboros 0.24.0

- uroboros: v0.24.0 → 0.24.0 @ 4f22f81
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v8 · verifier eval: v2 · reviewer eval: v2 · implement eval: v1 · started: 2026-10-24T17:51:58.039Z
- compared with: implement → nothing yet

### implement

End to end: pass. Each cell: the median, then every run.

| | single |
|---|---|
| implement: first implementer → session end (min) | 7.9 (7.9 · 9.4 · 6.7) |
| implementers: first start → last end (min) | 2.1 (2.1 · 2.1 · 1.9) |
| implementer minutes, added up | 2.1 (2.1 · 2.1 · 1.9) |
| implementer dispatches | 1 (1 · 1 · 1) |
| implementers at once (max) | 1 (1 · 1 · 1) |
| implementer tokens | 46353 (45880 · 47793 · 46353) |
| session cost (USD, estimate) | 2.73 (2.73 · 3.46 · 2.70) |
| session duration (min) | 9.6 (9.6 · 11.4 · 8.2) |
| session output tokens | 44488 (44016 · 66174 · 44488) |
| questions asked | 1 (2 · 1 · 1) |
| hidden tests | 14/14 · 14/14 · 14/14 |
| gate green | ✓ · ✓ · ✓ |
| every task checked | ✓ · ✓ · ✓ |
| `### Waves` in loop-state.md | absent · absent · absent |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- Implement speed on other features: the implement eval resumes one fixed feature whose three user stories share no file, the case parallel implementers are built for; a `tasks.md` whose stories share a file runs one implementer, as the pipeline modes show.
- Modes not measured in this result: default, auto, goal, compat, verify, review.
