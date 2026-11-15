# uroboros 0.30.0+b3b5ce3.dirty

- uroboros: ..\uroboros → 0.30.0 @ b3b5ce3 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v9 · verifier eval: v2 · reviewer eval: v2 · implement eval: v1 · started: 2026-11-14T20:57:05.749Z
- compared with: default, auto, goal, compat, verify, review → 0.29.0+4c92709.dirty

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 16/0/0 | 17/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 10 | 10 |
| cost (USD, estimate) | 7.26 | 7.07 |
| duration (min) | 23.1 | 19.7 |
| output tokens | 110722 | 103758 |

Planted ambiguities:

- **P1** asked — Q2 'Quién pausa': '¿Quién puede pausar y reanudar una publicación?' answer: 'Su vendedor y los admins'
- **P2** asked — Q4 'Pausada': decides búsqueda, ver por enlace, pedido nuevo, listas de pedidos; answer 'Oculta y sin pedidos' (detail-by-link left as today, per resumen: 'Verla por su enlace ... sigue[n] como hoy')
- **P3** asked — Q4 'Pausada' covers 'hacerle un pedido nuevo'; answer 'Oculta y sin pedidos' → orders refused while paused
- **P4** asked — Q3 'Ranking': '¿Qué significa "sin perder su ranking"?' answer: 'Conserva su puntaje'
- **P5** asked — Q5 'Repetidas': 'pausar una publicación que ya está pausada, o reanudar una que ya está activa. ¿Qué pasa?' answer: 'Se acepta sin cambios'

Earlier decisions the idea changes:

- **D1** asked — Q1 'Estados': 'Tu idea agrega un segundo estado, "pausada" ... Esto cambia aquella decisión. ¿Qué querés?' answer: 'Agregar "pausada"'
- **D2** asked — Q2 'Quién pausa': 'En moderación decidiste que solo los administradores cambian el estado ... ¿Quién puede pausar y reanudar una publicación?' answer: 'Su vendedor y los admins'

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
| verifier (pass/fail/not-run per round) | 13/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.96 | 6.09 |
| duration (min) | 15.4 | 17.1 |
| output tokens | 84458 | 95613 |

Planted ambiguities:

- **P1** recorded_assumption — A2 — Only the seller who owns the listing may pause and resume it; other sellers, buyers and admins are refused.
- **P2** recorded_assumption — A4 — A paused listing is withdrawn from buyers: it does not appear in search results (for anyone); ... its detail still answers and shows status `paused`
- **P3** recorded_assumption — A4 — ... ordering it is refused with a 4xx error; ...
- **P4** recorded_assumption — A3 — ... the rank score is kept exactly as it was ... The exact search position is not frozen (other listings may move meanwhile).
- **P5** recorded_assumption — A5 — Pausing an already paused listing, or resuming a listing that is not paused, is refused with a 4xx error and changes nothing.

Earlier decisions the idea changes:

- **D1** recorded_assumption — A1 — A listing may now have a second status, `paused`, alongside `active`. This changes what 000-moderation decided (D1: "a single status, `active`; no other status exists for now").
- **D2** recorded_assumption — A2 — Only the seller who owns the listing may pause and resume it ... This changes 000-moderation D2 ("Only admins change a listing's status") for these two actions only.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 12/0/0 | 9/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 12 | 11 |
| cost (USD, estimate) | 4.03 | 3.82 |
| duration (min) | 13.6 | 16.4 |
| output tokens | 67509 | 64360 |

Planted ambiguities:

- **P1** asked — Q4 'Quién pausa': '¿Quién puede pausar y reanudar una publicación?' options [Solo su vendedor, Su vendedor y admins, Solo los admins] → answer: 'Su vendedor y admins'
- **P2** asked — Q6 'En pausa': '¿cómo la tratan las demás partes de la API? Esto decide a la vez: la búsqueda, ver la publicación por su enlace...' options include 'Fuera de venta' → answer: 'Fuera de venta'
- **P3** asked — Q6 answer 'Fuera de venta' decides at once search, detail, order placement, order list, and ranking accrual (per question text listing those readers)
- **P4** asked — Q5 'Ranking': '¿qué debe conservar al reanudarse?' options [Sus puntos, Su puesto exacto] → answer: 'Sus puntos'
- **P5** asked — Q7 'Repetido': '¿Qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?' options [Se rechaza con error, Se acepta sin cambios] → answer: 'Se acepta sin cambios'

Earlier decisions the idea changes:

- **D1** asked — Q1 'Estados': 'decidiste que una publicación tenía un solo estado posible, "activa"... Tu idea agrega un segundo estado: "pausada"... ¿Cómo queda?' → answer: 'Activa y pausada'
- **D2** asked — Q4 'Quién pausa': 'En moderación decidiste que solo los administradores pueden cambiar el estado de una publicación... ¿Quién puede pausar y reanudar una publicación?' → answer: 'Su vendedor y admins'

### compat

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
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 0.32 | 0.31 |
| duration (min) | 1.1 | 1.1 |
| output tokens | 3022 | 2512 |

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
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 2 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 8.72 | 8.08 |
| duration (min) | 39.4 | 37.9 |
| output tokens | 177830 | 163247 |

### review

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
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 |
| reviewer on the clean copy | CLEAN 3/3 runs · findings 0 · risks 0 | CLEAN 3/3 runs · findings 0 · risks 0 |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 8.71 | 8.77 |
| duration (min) | 29.9 | 29.9 |
| output tokens | 106657 | 105619 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
