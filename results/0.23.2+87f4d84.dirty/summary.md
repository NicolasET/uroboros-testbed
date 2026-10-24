# uroboros 0.23.2+87f4d84.dirty

- uroboros: ..\uroboros → 0.23.2 @ 87f4d84 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v8 · verifier eval: v2 · reviewer eval: v2 · started: 2026-10-23T23:17:53.100Z
- compared with: default, auto, goal, compat → nothing yet

### default

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| contradicted standing decisions surfaced | 2/2 |
| decisions.md at the end | pass |
| duplicate standing decisions (judge) | none |
| "No sé" to a list (lists · items kept) | not exercised |
| hidden tests | 11/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | 14/0/0 |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 14 |
| cost (USD, estimate) | 6.16 |
| duration (min) | 18.6 |
| output tokens | 96076 |

Planted ambiguities:

- **P1** asked — Q5 'Quién pausa': '¿Quién puede pausar y reanudar una publicación?' → answer 'Dueño y administradores'; refusal of others reinforced in Q12 answer 'rechazo P1 junto al vendedor'.
- **P2** asked — Q3 'Pausada' lists search/detail/orders explicitly; answer 'Oculta y sin pedidos' → D3: 'not in search, refuses new orders, detail still answers with status `paused`.'
- **P3** asked — Q3 'Pausada' answer 'Oculta y sin pedidos' → D3: '...refuses new orders, detail still answers with status `paused`.'
- **P4** asked — Q10 answer: 'el rankScore se preserva exactamente, pero la posición en la búsqueda no está garantizada — otros listados pueden haberla adelantado mientras estaba pausada.'
- **P5** asked — Q6 'Repetidas': '¿Qué pasa con las acciones repetidas... pausar una publicación que ya está pausada, o reanudar una que ya está activa?' → answer 'Éxito sin cambios'.

Contradicted standing decisions:

- **S1** asked — Q2 'Quién cambia': 'solo los administradores cambian el estado... ¿Qué hacemos con esa regla?' → answer 'Excepción solo aquí'.
- **S3** asked — Q1 'Estado único': 'una publicación tiene un único estado, `active`... ¿Qué hacemos con esa regla?' → answer 'Excepción solo aquí'.

### auto

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| contradicted standing decisions surfaced | 2/2 |
| decisions.md at the end | pass |
| duplicate standing decisions (judge) | - |
| "No sé" to a list (lists · items kept) | not exercised |
| hidden tests | 8/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | 13/0/0 |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 0 |
| cost (USD, estimate) | 6.39 |
| duration (min) | 18.8 |
| output tokens | 102406 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the seller who owns the listing may pause/resume it; other sellers, buyers, admins → 403; unauthenticated → 401; unknown listing → 404.
- **P2** recorded_assumption — A4 A paused listing is excluded from `GET /listings` search results for every caller. A5 `GET /listings/:id` keeps working ... and shows `status: "paused"`.
- **P3** recorded_assumption — A6 Ordering a paused listing is refused with a 4xx; existing orders unaffected.
- **P4** recorded_assumption — A7 Pause and resume leave `rankScore` and `createdAt` unchanged; on resume the listing returns to the search position its unchanged rank gives.
- **P5** recorded_assumption — A8 Pausing an already paused listing, or resuming an active one, is refused with a 4xx (conflict) and changes nothing.

Contradicted standing decisions:

- **S1** recorded_assumption — A1 Standing decisions "Only admins change a listing's status" (S1) ... contradict the idea. Set aside for this feature only ... `.uroboros/decisions.md` unchanged (never under --auto).
- **S3** recorded_assumption — A1 ... "A listing has a single status, active" (S3) contradict the idea. Set aside for this feature only ... `.uroboros/decisions.md` unchanged (never under --auto).

### goal

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| contradicted standing decisions surfaced | 2/2 |
| decisions.md at the end | pass |
| duplicate standing decisions (judge) | none |
| "No sé" to a list (lists · items kept) | not exercised |
| hidden tests | 11/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 12 |
| cost (USD, estimate) | 2.80 |
| duration (min) | 10.1 |
| output tokens | 47481 |

Planted ambiguities:

- **P1** asked — Q5 'quien puede pausar y reanudar una publicacion?' options Dueno/Duenio y admins -> answer: 'Dueño y administradores'
- **P2** asked — Q3 asks what happens in search/by-id/orders while paused -> answer: 'Oculta en búsqueda, visible por id, sin pedidos'
- **P3** asked — Q3 'Oculta en búsqueda, visible por id, sin pedidos' settles that orders are refused while paused
- **P4** asked — Q9 resumen: 'conserva su puntaje y, al reanudarse, vuelve a la búsqueda en el mismo lugar que le corresponde por ese puntaje' -> answer 'Coincide'
- **P5** asked — Q6 'pausar una publicación ya pausada, y reanudar una que ya está activa' -> answer: 'Éxito sin cambios'

Contradicted standing decisions:

- **S1** asked — Q2 'solo los administradores cambian el estado... ¿Qué hacemos con esa regla?' -> answer: 'Solo para esta función'
- **S3** asked — Q1 'una publicación tiene un único estado, active... ¿Qué hacemos con esa regla?' -> answer: 'Solo para esta función'

### compat

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| contradicted standing decisions surfaced | - |
| decisions.md at the end | - |
| duplicate standing decisions (judge) | - |
| "No sé" to a list (lists · items kept) | - |
| hidden tests | - |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 0.44 |
| duration (min) | 1.3 |
| output tokens | 3639 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- Modes not measured in this result: verify, review.
