# uroboros 0.26.0+61a59c3.dirty

- uroboros: ..\uroboros → 0.26.0 @ 61a59c3 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v8 · verifier eval: v2 · reviewer eval: v2 · implement eval: v1 · started: 2026-10-28T19:55:02.569Z
- compared with: default, auto, goal → 0.25.0+52c1a67.dirty; compat, verify, review → 0.25.0+4f22f81.dirty

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | S5 restates S1 | none |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 15/0/0 | 8/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 10 | 11 |
| cost (USD, estimate) | 6.59 | 7.75 |
| duration (min) | 22.2 | 22.4 |
| output tokens | 107958 | 115658 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación? ... Dueño y administradores" (Q5); extended by Q8 "¿puede el vendedor reanudarla? ... Sí, cualquiera"
- **P2** asked — Q6 "¿cómo tratan las funciones que ya existen a una publicación pausada? ... búsqueda, detalle..." answer "Oculta y sin pedidos" → D6: 'no aparece en la búsqueda ... su detalle sigue respondiendo con status `paused`'
- **P3** asked — Same Q6 covers orders: answer "Oculta y sin pedidos" → D6: 'no acepta pedidos nuevos'
- **P4** asked — Q3 "Al reanudarla, ¿qué se conserva? ... El puntaje" → D3: 'keeps the rank score: on resume the listing has the same score it had when paused'
- **P5** asked — Q7 "pausar una publicación que ya está pausada, o reanudar una que ya está activa ... ¿Qué responde la API? ... Éxito sin cambios"

Contradicted standing decisions:

- **S1** asked — Q2 "Otra decisión del proyecto dice: 'Solo los administradores cambian el status...' ¿Qué hacemos con esa regla? ... Excepción solo aquí"
- **S3** asked — Q1 "Una publicación tiene un único status, `active`. Esta funcionalidad agrega un segundo status... ¿Qué hacemos con esa regla? ... Excepción solo aquí"

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
| verifier (pass/fail/not-run per round) | 15/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.60 | 6.45 |
| duration (min) | 17.2 | 20.8 |
| output tokens | 103047 | 94081 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the owning seller may pause or resume it; other sellers, buyers and admins are refused (403), unauthenticated callers 401, unknown listing 404
- **P2** recorded_assumption — A5 (rule) A paused listing is excluded from search, orders on it are refused with a 4xx error, it stays readable by id with status `paused`, existing orders are untouched
- **P3** recorded_assumption — A5 ... orders on it are refused with a 4xx error ... (rule)
- **P4** recorded_assumption — A4 'Sin perder su ranking' = the listing's `rankScore` is unchanged by pause and by resume; after resume its search position is whatever the normal ranking gives that score ... no position is reserved
- **P5** recorded_assumption — A6 Repeated actions: pausing an already-paused listing or resuming an active one is refused with a 4xx error in the API's error style and changes nothing (rationale: explicit, no state change).

Contradicted standing decisions:

- **S1** recorded_assumption — A1 Standing decision S1 set aside for this feature only — the owning seller may pause/resume their own listing; every other status change stays admin-only; decisions.md not edited
- **S3** recorded_assumption — A2 Standing decision S3 set aside for this feature only — statuses are `active` and `paused` (rationale: the idea explicitly names status `paused`; reversible, project file untouched).

### goal

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
| verifier (pass/fail/not-run per round) | 9/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 11 | 11 |
| cost (USD, estimate) | 3.59 | 3.64 |
| duration (min) | 14.4 | 13.1 |
| output tokens | 63231 | 61959 |

Planted ambiguities:

- **P1** asked — Q5: "¿Quién puede pausar y reanudar una publicación concreta? (Los demás recibirán un error de permiso.)" → answer: "Su vendedor y admins"
- **P2** asked — Q4: "¿Cuál es la regla general para una publicación pausada?" → answer "Oculta y sin pedidos" (D4: not in search; detail still answers showing status `paused`)
- **P3** asked — Q4 answer "Oculta y sin pedidos" (D4: accepts no new orders) — same question settles ordering while paused
- **P4** asked — Q3: "'Sin perder su ranking' ¿qué debe conservar al reanudarla?" → answer: "Conservar su puntaje"
- **P5** asked — Q6: "¿Qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?" → answer: "Se acepta sin cambios"

Contradicted standing decisions:

- **S1** asked — Q2: "solo los administradores cambian el estado de una publicación... ¿Qué hacemos con esa decisión?" → answer: "Dejarla de lado solo aquí"
- **S3** asked — Q1: "una publicación tiene un único estado, `active`... ¿Qué hacemos con esa decisión?" → answer: "Dejarla de lado solo aquí"

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
| cost (USD, estimate) | 0.27 | 0.30 |
| duration (min) | 1.1 | 1.3 |
| output tokens | 2461 | 3576 |

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
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 5 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 7.58 | 7.69 |
| duration (min) | 39.7 | 38.8 |
| output tokens | 163687 | 166336 |

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
| cost (USD, estimate) | 7.73 | 8.04 |
| duration (min) | 28.3 | 28.1 |
| output tokens | 103960 | 104355 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
