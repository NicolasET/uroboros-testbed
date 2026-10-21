# uroboros 0.17.0+94b45c4.dirty

- uroboros: ..\uroboros → 0.17.0 @ 94b45c4 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v1 · reviewer eval: v1 · started: 2026-10-21T04:35:09.375Z
- compared with: default, auto, goal, compat, verify → 0.16.0+243c7ba.dirty; review → 0.16.2

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 17/0/0 | 16/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 16 |
| cost (USD, estimate) | 6.62 | 6.81 |
| duration (min) | 18.8 | 21.9 |
| output tokens | 104381 | 104039 |

Planted ambiguities:

- **P1** asked — Q: "¿Quién puede pausar y reanudar una publicación?" A: "El dueño y los admins"
- **P2** asked — Q: "...¿qué debe pasar con ella en la búsqueda?" A: "Oculta para todos"; and Q: "...¿Qué debe responder esa consulta [GET /listings/:id] para una publicación pausada?" A: "Visible para todos"
- **P3** asked — Q: "¿Se pueden hacer pedidos nuevos sobre una publicación pausada?" A: "No, se rechazan"
- **P4** asked — Q: "Al pausar, la publicación conserva sus puntos de ranking (rankScore) intactos. Mientras está pausada, las demás pueden seguir sumando puntos con pedidos. Al reanudarla, ¿qué significa 'no perder su ranking'?" A: "Conserva sus puntos"
- **P5** asked — Q: "Acciones repetidas: ¿qué pasa si se pide pausar una publicación que ya está pausada, o reanudar una que ya está activa?" A: "Éxito sin cambios"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 14/0/0 | 14/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.15 | 5.29 |
| duration (min) | 14.8 | 14.2 |
| output tokens | 82710 | 85287 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Who may pause/resume: only the seller who owns the listing. Other sellers, buyers and admins get 403; no caller 401; unknown listing 404.
- **P2** recorded_assumption — A5 Paused listings are excluded from search results (GET /listings)... A6 GET /listings/:id still returns a paused listing, showing status `paused`.
- **P3** recorded_assumption — A7 New orders on a paused listing are refused (409 `listing_paused`); the listing gains no rank.
- **P4** recorded_assumption — A4 Ranking kept = rankScore is never changed by pause or resume; a resumed listing sits exactly where its score places it.
- **P5** recorded_assumption — A9 Pausing an already-paused listing → 409 `listing_already_paused`; resuming a listing that is not paused → 409 `listing_not_paused`. Nothing changes in either case.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 | 11/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 11 | 14 |
| cost (USD, estimate) | 2.33 | 2.69 |
| duration (min) | 8.4 | 12.7 |
| output tokens | 39409 | 45606 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar/reanudar una publicación?" — answer: "El vendedor dueño y un admin"
- **P2** asked — "¿Qué pasa con una publicación pausada en la búsqueda?" → "Se oculta de la búsqueda"; and "¿Qué pasa al consultar directamente una publicación pausada?" → "Se ve, con status paused"
- **P3** asked — "¿Se puede pedir una publicación pausada?" — answer: "No, se rechaza el pedido"
- **P4** asked — User correction at shared-understanding check: "En el punto 4, al reanudar se preserva el rankScore, pero la posición en búsqueda no está garantizada porque otros listados pueden haberlo adelantado."
- **P5** asked — "Regla para acciones repetidas: ¿qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?" — answer: "Éxito sin cambios (200)"

### compat

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 0.27 | 0.28 |
| duration (min) | 0.5 | 0.7 |
| output tokens | 2636 | 2914 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 | route 3/3 · cache 3/3 · status 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 3.99 | 4.03 |
| duration (min) | 15.9 | 15.4 |
| output tokens | 77351 | 77601 |

### review

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 1/3 · weakened 3/3 · extra 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 |
| reviewer on the clean copy | CLEAN 3/3 runs · findings 0 · risks 0 | CLEAN 3/3 runs · findings 0 · risks 0 |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.39 | 5.48 |
| duration (min) | 16.7 | 12.8 |
| output tokens | 97389 | 74474 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
