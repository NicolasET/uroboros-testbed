# uroboros 1.1.0+f2989ae.dirty

- uroboros: ..\uroboros → 1.1.0 @ f2989ae (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.327 · Agent SDK 0.3.327
- scenario: v9 · verifier eval: v4 · reviewer eval: v4 · implement eval: v3 · small eval: v1 · medium eval: v1 · resume eval: v1 · parts eval: v1 · started: 2026-11-20T07:52:25.549Z
- compared with: default, auto, small, verify, review → 1.0.0+59b5a03.dirty; medium, resume → 1.0.0; goal, compat → 0.32.0+027a673.dirty

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | 1 · 1 kept | 1 · 1 kept |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 9/0/0 | 12/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | large | large |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 1 · 4 · 2 · 1 | 1 · 4 · 3 · 1 |
| reviews, by phase | goal → plan → plan → implement | goal → goal → plan → implement |
| goal.md reviewed before any code | yes | yes |
| plan.md written | yes | yes |
| what the user typed kept inside .git | yes | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - | - |
| parts: hidden tests in the main checkout → in each part | - | - |
| parts: questions (main · each part), cost of each part | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 9 | 10 |
| cost (USD, estimate) | 5.19 | 5.43 |
| duration (min) | 20.7 | 20.4 |
| output tokens | 86216 | 92356 |

Planted ambiguities:

- **P1** asked — Q2: "La idea dice que los vendedores pausan. ¿Quién puede pausar y reanudar una publicación?" answer: "Su vendedor y admins"
- **P2** asked — Q4: "¿cómo tratan a una publicación pausada las partes del API que ya existen?" answer: "Fuera de búsqueda — No sale en la búsqueda... su detalle sigue visible para cualquiera, mostrando que está pausada."
- **P3** asked — Q4 answer "Fuera de búsqueda": "No sale en la búsqueda ni se puede pedir..."
- **P4** asked — Q3: "¿Qué significa «sin perder su ranking»?" answer: "Conserva el puntaje — Vuelve con sus 30 puntos y sale donde ese puntaje la ponga ahora"
- **P5** asked — Q5: "Regla para acciones repetidas: ¿qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?" answer: "Funciona sin cambios"

Earlier decisions the idea changes:

- **D1** asked — Q1: "decidiste que una publicación tiene un solo estado, «activa»... Esta idea agrega un segundo estado, `paused`... ¿qué estados puede tener una publicación?" answer: "Activa y pausada"
- **D2** asked — Q2: "En moderación decidiste que solo los administradores pueden cambiar el estado de una publicación. La idea dice que los vendedores pausan. ¿Quién puede pausar y reanudar una publicación?" answer: "Su vendedor y admins"

Lists answered "No sé": Caso menor

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 8/0/0 | 9/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | large | large |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 2 · 5 · 3 · 1 | 1 · 4 · 3 · 1 |
| reviews, by phase | goal → goal → plan → implement → implement | goal → plan → plan → implement |
| goal.md reviewed before any code | yes | yes |
| plan.md written | yes | yes |
| what the user typed kept inside .git | yes | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - | - |
| parts: hidden tests in the main checkout → in each part | - | - |
| parts: questions (main · each part), cost of each part | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.93 | 5.28 |
| duration (min) | 22.0 | 18.3 |
| output tokens | 89811 | 94070 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the seller who owns the listing may pause or resume it... A4 Admins are not given pause/resume. Rationale: the idea names only sellers; smaller scope. (Q4)
- **P2** recorded_assumption — A6 Rule — a paused listing is not available: hidden from search, still returned by id with status paused, new orders refused, existing orders still listed, rankScore unchanged.
- **P3** recorded_assumption — A6 Rule — ... new orders refused, existing orders still listed, rankScore unchanged. (Q6)
- **P4** recorded_assumption — A5 "Without losing its ranking" keeps the rankScore unchanged; no search position is reserved.
- **P5** recorded_assumption — A7 Pausing an already paused listing or resuming an active one is refused (409, existing error style), nothing changes.

Earlier decisions the idea changes:

- **D1** recorded_assumption — A2 Allow a second status `paused` besides `active`, changing what 000-moderation D1 decided (only `active`). Rationale: the idea cannot be built otherwise... (Q1)
- **D2** recorded_assumption — A3 Only the seller who owns the listing may pause or resume it; this narrows the change to 000-moderation D2 (only admins change status) to that one case. (Q2, Q3)

### small

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | 2/2 | 2/2 |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | 2/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | small | small |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 1 · 1 · 0 · 1 | 1 · 1 · 1 · 1 |
| reviews, by phase | implement | implement |
| goal.md reviewed before any code | no | no |
| plan.md written | no | no |
| what the user typed kept inside .git | yes | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - | - |
| parts: hidden tests in the main checkout → in each part | - | - |
| parts: questions (main · each part), cost of each part | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 1 | 2 |
| cost (USD, estimate) | 2.27 | 2.37 |
| duration (min) | 8.5 | 8.2 |
| output tokens | 26047 | 32342 |

### medium

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | 4/4 | 4/4 |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | 6/0/0 | 7/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | medium | medium |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 1 · 2 · 4 · 1 | 1 · 2 · 4 · 1 |
| reviews, by phase | goal → implement | goal → implement |
| goal.md reviewed before any code | yes | yes |
| plan.md written | no | no |
| what the user typed kept inside .git | yes | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - | - |
| parts: hidden tests in the main checkout → in each part | - | - |
| parts: questions (main · each part), cost of each part | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 10 | 9 |
| cost (USD, estimate) | 4.47 | 3.85 |
| duration (min) | 18.4 | 15.6 |
| output tokens | 64994 | 63034 |

### resume

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | 2/2 | 2/2 |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | small | small |
| subagents dispatched (implementer · reviewer · refuter · verifier) | 1 · 1 · 0 · 1 | 1 · 1 · 0 · 1 |
| reviews, by phase | implement | implement |
| goal.md reviewed before any code | no | no |
| plan.md written | no | no |
| what the user typed kept inside .git | yes | yes |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | yes · yes · yes · 0 | yes · yes · yes · 1 |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | 1/0/0/0 → 1/1/0/1 | 1/0/0/0 → 1/1/0/1 |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - | - |
| parts: hidden tests in the main checkout → in each part | - | - |
| parts: questions (main · each part), cost of each part | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 1 | 2 |
| cost (USD, estimate) | 1.68 | 1.59 |
| duration (min) | 7.4 | 8.1 |
| output tokens | 20800 | 20660 |

### goal

NOT APPLICABLE — from uroboros 1.0.0 every run is the flow `--goal` selected: the default mode measures it.

### compat

NOT APPLICABLE — uroboros 1.0.0 removed the compat skill with spec-kit.

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 · rank 3/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 · rank 3/3 |
| verifier detection by a property probe (caught / runs) | edge 1/3 · rank 3/3 | edge 2/3 · rank 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 5 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | - | - |
| subagents dispatched (implementer · reviewer · refuter · verifier) | - | - |
| reviews, by phase | - | - |
| goal.md reviewed before any code | - | - |
| plan.md written | - | - |
| what the user typed kept inside .git | - | - |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - | - |
| parts: hidden tests in the main checkout → in each part | - | - |
| parts: questions (main · each part), cost of each part | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 12.19 | 12.22 |
| duration (min) | 60.4 | 58.9 |
| output tokens | 263168 | 258488 |

### review

| | previous | this run |
|---|---|---|
| end to end | pass | FAIL (every run returned a report) |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 2/3 |
| reviewer detection after the refuter (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 2/3 |
| reviewer on the clean copies | rule-clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 · clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 | rule-clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 · clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 |
| size the run recorded | - | - |
| subagents dispatched (implementer · reviewer · refuter · verifier) | - | - |
| reviews, by phase | - | - |
| goal.md reviewed before any code | - | - |
| plan.md written | - | - |
| what the user typed kept inside .git | - | - |
| resume: cut with its implementer running · marker taken over · goal.md unchanged · questions on the resume | - | - |
| resume: dispatched before the cut → by the resume (implementer/reviewer/refuter/verifier) | - | - |
| parts: split · each part's marker · dependencies installed in its worktree · joint report | - | - |
| parts: hidden tests in the main checkout → in each part | - | - |
| parts: questions (main · each part), cost of each part | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 16.78 | 16.94 |
| duration (min) | 63.4 | 62.2 |
| output tokens | 202268 | 207500 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- What the orchestrator does after the refuter: the reviewer eval scores the reviewer's report and, from uroboros 0.29.0, which of its items survive the refuter, but it asks no question and folds nothing.
- Modes not measured in this result: goal, compat.
