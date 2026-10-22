# uroboros 0.23.0+c2ac5ff

- uroboros: /home/user/uroboros → 0.23.0 @ c2ac5ff
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-22T04:30:52.712Z
- compared with: default, auto, goal, compat, verify, review → 0.22.0+56a5bc1

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 15/0/0 | 14/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 16 | 15 |
| cost (USD, estimate) | 6.57 | 7.11 |
| duration (min) | 21.0 | 20.2 |
| output tokens | 102058 | 106156 |

Planted ambiguities:

- **P1** asked — Q: '¿Quién puede pausar y reanudar una publicación?...' A: 'Su vendedor y un admin'
- **P2** asked — Q: 'Mientras está pausada, ¿la publicación aparece en la búsqueda...?' A: 'Oculta de la búsqueda'; and Q: '...¿qué pasa al pedir la publicación directamente por su id (GET /listings/:id)?...' A: 'Visible para todos'
- **P3** asked — Q: 'Mientras está pausada, ¿se puede comprar (POST /listings/:id/orders)?...' A: 'Se rechazan los pedidos'
- **P4** asked — User correction on the summary question: 'Lo que se preserva es el número de rankScore (el valor exacto), no su posición en los resultados de búsqueda — otros listados pueden haberla rebasado mientras estuvo pausada.'
- **P5** asked — Q: 'Regla para acciones repetidas o fuera de lugar: pausar una publicación que ya está pausada, o reanudar una que ya está activa...¿Qué resultado deben recibir?' A: 'Éxito sin cambios'

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 19/0/0 | 14/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.67 | 5.67 |
| duration (min) | 13.5 | 14.2 |
| output tokens | 93460 | 89331 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the owning seller may pause/resume. No/unknown `x-user-id` → 401 `unauthenticated`; unknown listing → 404 `listing_not_found`; buyers, admins, other sellers → 403 `not_listing_owner`.
- **P2** recorded_assumption — A5 Paused listings are excluded from `GET /listings` search. ... A6 `GET /listings/:id` still returns a paused listing to anyone (as today) with `status: "paused"`.
- **P3** recorded_assumption — A7 New orders on a paused listing → 409 `listing_paused`; existing orders untouched. Rationale: a paused publication is not sellable; no data rewritten.
- **P4** recorded_assumption — A4 Ranking preserved: pause/resume never modify `rankScore` or `createdAt`; after resume the listing sits where its rank puts it. Rationale: literal reading of "sin perder su ranking".
- **P5** recorded_assumption — A8 Repeated actions: pause on paused → 409 `listing_already_paused`; resume on non-paused → 409 `listing_not_paused`; listing unchanged. Rationale: explicit, no silent no-op.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 11/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 13 | 13 |
| cost (USD, estimate) | 3.33 | 2.75 |
| duration (min) | 11.6 | 9.5 |
| output tokens | 55851 | 48345 |

Planted ambiguities:

- **P1** asked — Q: "¿Quién puede pausar y reanudar una publicación? ... " A: "Dueño o admin" (D1)
- **P2** asked — Q: "¿Una publicación pausada aparece en la búsqueda (GET /listings)?" A: "Oculta para todos" (D2); Q: "¿Qué ve quien pide el detalle (GET /listings/:id) de una publicación pausada?" A: "Todos la ven" (D4)
- **P3** asked — Q: "¿Se puede comprar (POST /listings/:id/orders) una publicación pausada?" A: "No, se rechaza" (D3)
- **P4** asked — Goal-summary question answer: "Algo no cuadra: Al reanudar, la publicación vuelve a la búsqueda, pero no se le garantiza la misma posición de ranking ... El rankScore ... sí se preserva exactamente, pero la posición en los resultados de búsqueda no." (D11)
- **P5** asked — Q: "Regla para acciones repetidas: ¿qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa ...?" A: "Éxito sin cambios" (D5)

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
| cost (USD, estimate) | 0.21 | 0.25 |
| duration (min) | 0.9 | 0.9 |
| output tokens | 2485 | 2497 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.96 | 6.76 |
| duration (min) | 25.5 | 31.6 |
| output tokens | 166580 | 159331 |

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
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 |
| reviewer on the clean copy | CLEAN 3/3 runs · findings 0 · risks 0 | CLEAN 3/3 runs · findings 0 · risks 0 |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.47 | 5.43 |
| duration (min) | 11.8 | 20.5 |
| output tokens | 80573 | 78471 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
