# uroboros 0.19.0+35163f0

- uroboros: /home/user/uroboros → 0.19.0 @ 35163f0
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v1 · reviewer eval: v1 · started: 2026-10-21T16:37:16.313Z
- compared with: default, auto, goal, compat, verify, review → 0.18.0+63471dd.dirty

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 21/0/0 | 15/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 16 | 11 |
| cost (USD, estimate) | 6.85 | 5.46 |
| duration (min) | 23.3 | 14.2 |
| output tokens | 113274 | 84236 |

Planted ambiguities:

- **P1** asked — Q: "¿Quién puede pausar y reanudar una publicación? Hoy solo los vendedores crean publicaciones... existen además compradores y administradores." A: "Dueño y administradores"
- **P2** asked — Q: "¿Dónde se ve una publicación pausada? Hoy existen la búsqueda (GET /listings...) y la ficha individual (GET /listings/:id)..." A: "Fuera de búsqueda; ficha visible"
- **P3** asked — Q: "¿Qué pasa con las compras mientras una publicación está pausada? Hoy cada pedido suma 1 punto al ranking de la publicación." A: "Nuevos pedidos rechazados"
- **P4** asked — Summary question states: "...el ranking queda congelado y al reanudar vuelve con el mismo puntaje." User answered "Coincide", confirming rankScore is preserved exactly on resume.
- **P5** asked — Q: "¿Qué responde la API si se pausa una publicación ya pausada, o se reanuda una que ya está activa?" A: "Éxito sin cambios"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 13/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.46 | 4.67 |
| duration (min) | 17.3 | 11.1 |
| output tokens | 95303 | 74486 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the seller who owns the listing may pause or resume it; other sellers, buyers and admins are refused (403); unauthenticated callers 401.
- **P2** recorded_assumption — A4 A paused listing does not appear in search (GET /listings)... A5 A paused listing is still returned by GET /listings/:id, with status 'paused'.
- **P3** recorded_assumption — A6 Ordering a paused listing is refused (409, error listing_paused); no rank is gained.
- **P4** recorded_assumption — A7 Pausing and resuming do not change the listing's rank score or creation date; after resume it sorts exactly where its unchanged score/date put it.
- **P5** recorded_assumption — A8 Pausing an already-paused listing → 409 listing_already_paused; resuming a listing that is not paused → 409 listing_not_paused; state unchanged.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 | 12/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 10 | 12 |
| cost (USD, estimate) | 2.62 | 2.67 |
| duration (min) | 9.3 | 9.4 |
| output tokens | 44986 | 46616 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación? ... " → answer: "Dueño o admin"
- **P2** asked — "La búsqueda GET /listings ... ¿La publicación pausada se oculta de la búsqueda para todos ...?" → "Oculta para todos"; "¿Qué devuelve el detalle GET /listings/:id de una publicación pausada?" → "Visible con status paused"
- **P3** asked — "Si un comprador intenta comprar una publicación pausada, ¿qué respuesta recibe?" → confirmed concretely in: "6. Comprar una pausada: 409 `listing_paused`, sin crear orden ni subir ranking." → "Todos quedan así"
- **P4** asked — "Algo no cuadra: El rankScore se preserva exactamente, pero la posición en búsqueda no está garantizada — otras publicaciones pueden haberlo superado en el ranking." (answer to the shared-understanding summary question)
- **P5** asked — "¿Qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?" → "Éxito sin cambios"

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
| cost (USD, estimate) | 0.27 | 0.32 |
| duration (min) | 0.7 | 0.5 |
| output tokens | 2718 | 2882 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 | route 3/3 · cache 3/3 · status 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 2 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 4.06 | 3.71 |
| duration (min) | 14.0 | 12.6 |
| output tokens | 77700 | 79459 |

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
| cost (USD, estimate) | 5.55 | 5.45 |
| duration (min) | 12.5 | 12.0 |
| output tokens | 75044 | 78754 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
