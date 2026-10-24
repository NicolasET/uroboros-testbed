# uroboros 0.24.0+ba64acd.dirty

- uroboros: ..\uroboros → 0.24.0 @ ba64acd (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v8 · verifier eval: v2 · reviewer eval: v2 · started: 2026-10-24T13:45:54.305Z
- compared with: default, auto, goal, compat → 0.23.2+87f4d84.dirty; verify → 0.23.0+c2ac5ff; review → 0.23.1

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | none | none |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 14/0/0 | 14/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 10 |
| cost (USD, estimate) | 6.16 | 6.92 |
| duration (min) | 18.6 | 20.9 |
| output tokens | 96076 | 108469 |

Planted ambiguities:

- **P1** asked — Q3: '¿Quién puede pausar y reanudar una publicación?... Importa porque decide a quién se le rechaza la acción.' Answer: 'Dueño y administradores'
- **P2** asked — Q4: 'Regla general... la búsqueda (hoy devuelve todas)... el detalle de una publicación (hoy se lo devuelve a cualquiera)...' Answer: 'Fuera del mercado, detalle público'
- **P3** asked — Q4: '...hacer un pedido (hoy se acepta y suma +1 al puntaje)...' Answer: 'Fuera del mercado, detalle público' -> D6: 'new orders on it are refused'
- **P4** asked — Q1: 'Cuando dices "sin perder su ranking", al reanudar, ¿qué se conserva?...' Answer: 'Conservar el puntaje'
- **P5** asked — Q5: '¿Qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?' Answer: 'Éxito sin cambios'

Contradicted standing decisions:

- **S1** asked — 'El proyecto tiene una decisión vigente: "solo los administradores cambian el estado..."... ¿Qué hacemos con esa regla? (S1)' Answer: 'Excepción solo aquí'
- **S3** asked — 'Otra decisión vigente dice: "una publicación tiene un único estado, active"... ¿Qué hacemos con esa regla? (S3)' Answer: 'Excepción solo aquí'

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 13/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.39 | 5.93 |
| duration (min) | 18.8 | 17.1 |
| output tokens | 102406 | 93751 |

Planted ambiguities:

- **P1** recorded_assumption — A2 Only the seller who owns the listing may pause/resume it. Admins, other sellers and buyers are refused. Rationale: smallest scope matching "los vendedores".
- **P2** recorded_assumption — A3 Readers rule: a paused listing is excluded from search (GET /listings) for every caller; still returned by GET /listings/:id with `status: "paused"` (the way to see it)
- **P3** recorded_assumption — A3 ... cannot be ordered (4xx, no order, no rank change); its existing orders are unchanged and still appear in GET /orders.
- **P4** recorded_assumption — A4 "Without losing its ranking": pause and resume never change rankScore or createdAt; after resume the listing appears in search wherever its unchanged score places it; no position is frozen.
- **P5** recorded_assumption — A5 Pausing an already-paused listing, or resuming a listing that is not paused, is rejected with a 4xx error and changes nothing.

Contradicted standing decisions:

- **S1** recorded_assumption — A1 The idea contradicts standing decisions S1 ("Only admins change a listing's status") and S3 ("A listing has a single status, `active`"). Both set aside for this feature only; decisions.md not changed (never under --auto).
- **S3** recorded_assumption — A1 The idea contradicts standing decisions S1 ("Only admins change a listing's status") and S3 ("A listing has a single status, `active`"). Both set aside for this feature only; decisions.md not changed (never under --auto).

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | none | S5 restates S1 |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 12 | 11 |
| cost (USD, estimate) | 2.80 | 3.45 |
| duration (min) | 10.1 | 12.9 |
| output tokens | 47481 | 59956 |

Planted ambiguities:

- **P1** asked — Q5 'Permiso': "¿Quién puede pausar y reanudar una publicación concreta?" options incl. 'Su vendedor y admins' — Answer: 'Su vendedor y admins'.
- **P2** asked — Q4 'Pausada' answer 'Oculta en búsqueda'; confirmed in Resumen (Q9) AC-7: "Una pausada no sale en GET /listings; GET /listings/:id la muestra a todos con status `paused`."
- **P3** asked — Resumen (Q9) AC-8: "Pedir una publicación pausada da error 4xx, no crea pedido y su puntaje no sube." — user answered 'Coincide'.
- **P4** asked — Q3 'Ranking': "¿Qué conserva exactamente 'sin perder su ranking'?" options 'Conservar el puntaje' / 'Conservar la posición' — Answer: 'Conservar el puntaje'.
- **P5** asked — Q6 'Repetición': "¿Qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?" — Answer: 'Éxito sin cambios'.

Contradicted standing decisions:

- **S1** asked — Q1 'Quién cambia': "...'solo los administradores cambian el status de una publicación'... ¿Qué hacemos con esa regla?" — Answer: 'Excepción solo aquí'.
- **S3** asked — Q2 'Status único': "...'una publicación tiene un único status, active'... ¿Qué hacemos con esa regla?" — Answer: 'Excepción solo aquí'.

### compat

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 0.44 | 0.25 |
| duration (min) | 1.3 | 1.1 |
| output tokens | 3639 | 2384 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 3 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.76 | 7.56 |
| duration (min) | 31.6 | 39.4 |
| output tokens | 159331 | 163551 |

### review

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 |
| reviewer on the clean copy | CLEAN 3/3 runs · findings 0 · risks 0 | CLEAN 3/3 runs · findings 0 · risks 0 |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 7.60 | 7.62 |
| duration (min) | 29.0 | 30.1 |
| output tokens | 104322 | 103130 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
