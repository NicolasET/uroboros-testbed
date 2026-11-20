# uroboros 1.0.0

- uroboros: ..\uroboros → 1.0.0 @ f2989ae
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.327 · Agent SDK 0.3.327
- scenario: v9 · verifier eval: v4 · reviewer eval: v4 · implement eval: v3 · small eval: v1 · medium eval: v1 · resume eval: v1 · parts eval: v1 · started: 2026-11-20T07:33:19.867Z
- compared with: medium, resume, parts, implement → nothing yet

### medium

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| earlier decisions the idea changes, surfaced | - |
| earlier decision the idea leaves alone, asked again | - |
| "No sé" to a list (lists · items kept) | - |
| hidden tests | 4/4 |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | 6/0/0 |
| verifier detection (caught / runs) | - |
| verifier detection by a property probe (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer detection after the refuter (caught / runs) | - |
| reviewer on the clean copies | - |
| size the run recorded | medium |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 1 · 2 · 4 · 1 |
| reviews, by phase | goal → implement |
| goal.md reviewed before any code | yes |
| plan.md written | no |
| what the user typed kept inside .git | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - |
| parts: hidden tests in the main checkout → in each part | - |
| parts: questions (main · each part), cost of each part | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 10 |
| cost (USD, estimate) | 4.47 |
| duration (min) | 18.4 |
| output tokens | 64994 |

### resume

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| earlier decisions the idea changes, surfaced | - |
| earlier decision the idea leaves alone, asked again | - |
| "No sé" to a list (lists · items kept) | - |
| hidden tests | 2/2 |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier detection by a property probe (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer detection after the refuter (caught / runs) | - |
| reviewer on the clean copies | - |
| size the run recorded | small |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 1 · 1 · 0 · 1 |
| reviews, by phase | implement |
| goal.md reviewed before any code | no |
| plan.md written | no |
| what the user typed kept inside .git | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | yes · yes · yes · 0 |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | 1/0/0/0 → 1/1/0/1 |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - |
| parts: hidden tests in the main checkout → in each part | - |
| parts: questions (main · each part), cost of each part | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 1 |
| cost (USD, estimate) | 1.68 |
| duration (min) | 7.4 |
| output tokens | 20800 |

### parts

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
| verifier detection (caught / runs) | - |
| verifier detection by a property probe (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer detection after the refuter (caught / runs) | - |
| reviewer on the clean copies | - |
| size the run recorded | - |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 1 · 3 · 3 · 1 |
| reviews, by phase | goal → goal → implement |
| goal.md reviewed before any code | yes |
| plan.md written | no |
| what the user typed kept inside .git | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | yes · startup-message complete · yes · yes (done) |
| parts: hidden tests in the main checkout → in each part | filter 4/4, startup 0/2 → filter 0/4, startup 2/2 |
| parts: questions (main · each part), cost of each part | 8 · 0; $2.11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 8 |
| cost (USD, estimate) | 5.96 |
| duration (min) | 13.0 |
| output tokens | 86966 |

### implement

End to end: pass. Each cell: the median, then every run.

| | default | parallel=3 |
|---|---|---|
| implement: first implementer → session end (min) | 9.7 (10.0 · 9.7 · 7.8) | 10.0 (9.7 · 10.0 · 10.8) |
| implementers: first start → last end (min) | 2.2 (2.2 · 2.8 · 1.8) | 2.9 (3.3 · 2.9 · 2.8) |
| implementer minutes, added up | 2.2 (2.2 · 2.8 · 1.8) | 3.7 (4.2 · 3.7 · 3.6) |
| implementer dispatches | 1 (1 · 1 · 1) | 4 (4 · 4 · 4) |
| implementers at once (max) | 1 (1 · 1 · 1) | 3 (3 · 3 · 3) |
| implementer tokens | 44155 (44155 · 47434 · 39737) | 119470 (119470 · 117626 · 127520) |
| session cost (USD, estimate) | 3.16 (3.28 · 3.16 · 2.63) | 3.97 (3.97 · 3.53 · 4.04) |
| session duration (min) | 11.8 (11.8 · 11.9 · 9.8) | 12.3 (11.6 · 12.3 · 12.9) |
| session output tokens | 54909 (57764 · 54909 · 47168) | 68181 (68181 · 58785 · 73920) |
| questions asked | 1 (1 · 2 · 1) | 1 (0 · 1 · 2) |
| hidden tests | 14/14 · 14/14 · 14/14 | 14/14 · 14/14 · 14/14 |
| gate green | ✓ · ✓ · ✓ | ✓ · ✓ · ✓ |
| every task checked | ✓ · ✓ · ✓ | ✓ · ✓ · ✓ |
| `### Waves` in loop-state.md | absent · none · absent | planned · planned · planned |

Waves recorded:

- default 2: none — no --parallel flag; one implementer gets G1–G4.
- parallel=3 1: - Dispatch before wave 1: G1 (AC-14) — src/order-cancel.ts, src/order-fulfill.ts, src/order-detail.ts, src/app.ts, src/gateway.ts. - Wave 1: G2 (AC-1..AC-5; src/order-cancel.ts, test/order-cancel.test.ts), G3 (AC-6..AC-9; src/order-fulfill.ts, test/order-fulfill.test.ts), G4 (AC-10..AC-13; src/order-detail.ts, test/order-detail.test.ts). - Dispatch after wave 1: none.
- parallel=3 2: - Dispatch before wave 1: G1 (AC-14) — src/order-cancel.ts, src/order-fulfill.ts, src/order-detail.ts, src/app.ts, src/gateway.ts. - Wave 1: G2 (AC-1..AC-5: src/order-cancel.ts, test/order-cancel.test.ts) ‖ G3 (AC-6..AC-9: src/order-fulfill.ts, test/order-fulfill.test.ts) ‖ G4 (AC-10..AC-13: src/order-detail.ts, test/order-detail.test.ts). - Dispatch after wave 1: none.
- parallel=3 3: - Dispatch before the wave: G1 (AC-14) — src/order-cancel.ts, src/order-fulfill.ts, src/order-detail.ts (new), src/app.ts, src/gateway.ts. Alone: the others need it. - Wave 1 (after G1): G2 (AC-1..AC-5: src/order-cancel.ts, test/order-cancel.test.ts) | G3 (AC-6..AC-9: src/order-fulfill.ts, test/order-fulfill.test.ts) | G4 (AC-10..AC-13: src/order-detail.ts, test/order-detail.test.ts). No shared fi

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- Implement speed on other features: the implement eval resumes one fixed feature whose three user stories share no file, the case parallel implementers are built for; a `tasks.md` whose stories share a file runs one implementer, as the pipeline modes show.
- Modes not measured in this result: default, auto, small, goal, compat, verify, review.
