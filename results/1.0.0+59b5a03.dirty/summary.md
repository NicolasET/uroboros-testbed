# uroboros 1.0.0+59b5a03.dirty

- uroboros: ..\uroboros → 1.0.0 @ 59b5a03 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.327 · Agent SDK 0.3.327
- scenario: v9 · verifier eval: v4 · reviewer eval: v4 · implement eval: v2 · small eval: v1 · started: 2026-11-19T22:50:38.453Z
- compared with: default, auto → 0.32.0+027a673.dirty; small, verify, review → nothing yet

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | not exercised | 1 · 1 kept |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 14/0/0 | 9/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | - | large |
| subagents dispatched (implementer · reviewer · refuter · verifier) | - | 1 · 4 · 2 · 1 |
| reviews, by phase | - | goal → plan → plan → implement |
| goal.md reviewed before any code | - | yes |
| plan.md written | - | yes |
| what the user typed kept inside .git | - | yes |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 8 | 9 |
| cost (USD, estimate) | 8.21 | 5.19 |
| duration (min) | 25.8 | 20.7 |
| output tokens | 128020 | 86216 |

Planted ambiguities:

- **P1** asked — Q3: '¿Quién puede pausar y reanudar una publicación?' answered 'Su vendedor y los admins — El vendedor dueño de la publicación, y también cualquier administrador.'
- **P2** asked — Q4 answered: 'Oculta y sin pedidos — No aparece en la búsqueda y no se puede pedir; consultarla por su id sigue funcionando y muestra que está pausada; los pedidos ya hechos no cambian.'
- **P3** asked — Q4 answered: 'Oculta y sin pedidos — No aparece en la búsqueda y no se puede pedir; ... los pedidos ya hechos no cambian.' (covers ordering)
- **P4** asked — Q2 answered: 'Conserva su puntaje — Al reanudar vuelve con sus 30 puntos y se ordena por ellos: en el ejemplo quedaría 2ª, detrás del escritorio.'
- **P5** asked — Q5 answered: 'Éxito, sin cambios — La API responde que salió bien y la publicación queda igual.'

Earlier decisions the idea changes:

- **D1** asked — Q1: 'Una función anterior ... decidió que una publicación tiene un único estado posible, "activa" ... Tu idea agrega un segundo estado, "pausada" ... ¿Qué hacemos con esa regla?'
- **D2** asked — Q3: '¿Quién puede pausar y reanudar una publicación? Las reglas de moderación anteriores decidieron que solo los administradores cambian el estado de una publicación; tu idea dice que los vendedores pausan.'

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
| verifier (pass/fail/not-run per round) | 13/0/0 | 8/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| size the run recorded | - | large |
| subagents dispatched (implementer · reviewer · refuter · verifier) | - | 2 · 5 · 3 · 1 |
| reviews, by phase | - | goal → goal → plan → implement → implement |
| goal.md reviewed before any code | - | yes |
| plan.md written | - | yes |
| what the user typed kept inside .git | - | yes |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.82 | 5.93 |
| duration (min) | 19.8 | 22.0 |
| output tokens | 102036 | 89811 |

Planted ambiguities:

- **P1** recorded_assumption — A5: Only the seller who owns the listing may pause or resume it; buyers, other sellers and admins are refused.
- **P2** recorded_assumption — A7: a paused listing is not on offer — excluded from search for every caller... detail still returns it with status `paused`
- **P3** recorded_assumption — A7: new orders refused (409 `listing_paused`, no order, no rank change)
- **P4** recorded_assumption — A6: pause and resume leave `rankScore` and `createdAt` unchanged... No frozen position.
- **P5** recorded_assumption — A8: ...409 for repeated actions (`listing_already_paused`, `listing_not_paused`); every refusal leaves the listing unchanged.

Earlier decisions the idea changes:

- **D1** recorded_assumption — A4: Listing statuses become `active` and `paused`. This changes 000-moderation D1 ("a single status, `active`, for now").
- **D2** recorded_assumption — A5: ...This changes 000-moderation D2 ("only admins change a listing's status") for pause/resume only; no admin status-change action is built.

### small

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
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 1 |
| cost (USD, estimate) | 2.27 |
| duration (min) | 8.5 |
| output tokens | 26047 |

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
| verifier detection by a property probe (caught / runs) | edge 1/3 · rank 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 5 |
| reviewer detection (caught / runs) | - |
| reviewer detection after the refuter (caught / runs) | - |
| reviewer on the clean copies | - |
| size the run recorded | - |
| subagents dispatched (implementer · reviewer · refuter · verifier) | - |
| reviews, by phase | - |
| goal.md reviewed before any code | - |
| plan.md written | - |
| what the user typed kept inside .git | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 12.19 |
| duration (min) | 60.4 |
| output tokens | 263168 |

### review

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
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 3/3 |
| reviewer detection after the refuter (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 3/3 |
| reviewer on the clean copies | rule-clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 · clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 |
| size the run recorded | - |
| subagents dispatched (implementer · reviewer · refuter · verifier) | - |
| reviews, by phase | - |
| goal.md reviewed before any code | - |
| plan.md written | - |
| what the user typed kept inside .git | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 16.78 |
| duration (min) | 63.4 |
| output tokens | 202268 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- What the orchestrator does after the refuter: the reviewer eval scores the reviewer's report and, from uroboros 0.29.0, which of its items survive the refuter, but it asks no question and folds nothing.
- Modes not measured in this result: goal, compat.
