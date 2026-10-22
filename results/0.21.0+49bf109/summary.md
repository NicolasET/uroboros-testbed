# uroboros 0.21.0+49bf109

- uroboros: /home/user/uroboros → 0.21.0 @ 49bf109
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-21T23:33:23.476Z
- compared with: default, auto, goal, compat, verify, review → 0.20.0+716cc04

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 15/0/0 | 16/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 13 | 14 |
| cost (USD, estimate) | 6.58 | 6.49 |
| duration (min) | 18.6 | 18.5 |
| output tokens | 103321 | 102541 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación? Hoy existen los roles vendedor, comprador y admin; solo el vendedor dueño puede crear publicaciones." → answer: "Dueño y admin"
- **P2** asked — "¿Dónde debe verse una publicación pausada? Esto define qué ven los compradores mientras está pausada." → answer: "Oculta en búsqueda; detalle visible"
- **P3** asked — "¿Qué pasa si intenta pedir una publicación pausada?" → answer: "Se rechaza el pedido" (and follow-up: "409 listing_paused")
- **P4** asked — User edit: "...the ranking score is preserved exactly, but the search position is not guaranteed; other listings may have overtaken it meanwhile..." then approved in next question: answer "Aprobar"
- **P5** asked — "Acciones repetidas: ¿qué debe responder la API si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?" → answer: "Éxito sin cambios"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 11/0/0 | 11/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.19 | 4.88 |
| duration (min) | 11.8 | 13.5 |
| output tokens | 79271 | 78024 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the seller who owns the listing may pause/resume it. No/unknown `x-user-id` → 401 `unauthenticated`; any other user (buyer, other seller, admin) → 403 `not_listing_owner`.
- **P2** recorded_assumption — A6 Paused listings are excluded from search results (GET /listings). ... A7 GET /listings/:id keeps returning a paused listing to any caller, with `status: "paused"`.
- **P3** recorded_assumption — A8 Ordering a paused listing (POST /listings/:id/orders) is refused with 409 `listing_paused`; no order created, rank unchanged.
- **P4** recorded_assumption — A5 Pause/resume never change `rankScore` (nor `createdAt`); a resumed listing reappears in search in the same position its rankScore/createdAt give it.
- **P5** recorded_assumption — A9 Repeated actions: pausing an already-paused listing → 409 `listing_already_paused`; resuming a listing that is not paused → 409 `listing_not_paused`; no state change in either.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 12 | 14 |
| cost (USD, estimate) | 3.05 | 3.07 |
| duration (min) | 9.9 | 10.5 |
| output tokens | 53280 | 52999 |

Planted ambiguities:

- **P1** asked — Q: '¿Quién puede pausar y reanudar una publicación?...' A: 'Dueño y admin'
- **P2** asked — Q: 'Mientras una publicación está pausada, ¿aparece en la búsqueda (GET /listings)?...' A: 'Oculta para todos'; and Q: '¿Qué devuelve el detalle de una publicación pausada (GET /listings/:id)?' A: 'Visible con status paused'
- **P3** asked — Q: '¿Se puede hacer un pedido (POST /listings/:id/orders) sobre una publicación pausada?...' A: 'No, se rechaza'
- **P4** asked — User correction to the agreement summary: 'Algo no cuadra: La posición en búsqueda al reanudar no está garantizada; otros anuncios pueden haberlo adelantado durante la pausa, aunque el rankScore sea idéntico.'
- **P5** asked — Q: '¿Qué pasa con las acciones repetidas o sin sentido: pausar una publicación que ya está pausada, o reanudar una que ya está activa?...' A: 'Éxito sin cambios'

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
| cost (USD, estimate) | 0.23 | 0.27 |
| duration (min) | 0.4 | 0.4 |
| output tokens | 2246 | 2699 |

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
| cost (USD, estimate) | 6.93 | 7.45 |
| duration (min) | 27.0 | 26.7 |
| output tokens | 163701 | 175221 |

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
| cost (USD, estimate) | 5.61 | 5.40 |
| duration (min) | 12.0 | 11.4 |
| output tokens | 82608 | 77811 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
