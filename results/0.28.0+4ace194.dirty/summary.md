# uroboros 0.28.0+4ace194.dirty

- uroboros: ..\uroboros → 0.28.0 @ 4ace194 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v8 · verifier eval: v2 · reviewer eval: v2 · implement eval: v1 · started: 2026-11-09T14:52:29.302Z
- compared with: default, auto, goal, compat, verify, review → 0.27.0+c4b24c0.dirty

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
| verifier (pass/fail/not-run per round) | 17/0/0 | 17/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 11 |
| cost (USD, estimate) | 7.36 | 7.24 |
| duration (min) | 23.8 | 18.7 |
| output tokens | 113736 | 106560 |

Planted ambiguities:

- **P1** asked — Q5 'Quién pausa': '¿Quién exactamente puede pausar y reanudar una publicación?' options 'Solo su vendedor' / 'Su vendedor y admins' / 'Cualquier vendedor' — answer: 'Su vendedor y admins'.
- **P2** asked — Q4 'Pausada': rule covering search (1) and detail (2) for a paused listing — answer: 'Fuera de búsqueda, visible' (out of search, detail visible marked paused).
- **P3** asked — Q4 'Pausada' explicitly lists '(3) hacer un pedido sobre ella' among the behaviors decided; answer 'Fuera de búsqueda, visible' is recorded in loop-state D4 as deciding 'search, detail, ordering'.
- **P4** asked — Q3 'Ranking': '"Sin perder su ranking" puede leerse de dos formas. ¿Qué debe conservarse al pausar?' options 'El puntaje' / 'La posición' / 'No lo sé' — answer: 'El puntaje'.
- **P5** asked — Q6 'Repetidas': '¿qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?' options 'Error, sin cambios' / 'Éxito, sin cambios' — answer: 'Éxito, sin cambios'.

Contradicted standing decisions:

- **S1** asked — Q1 'Quién cambia': rule 'solo los administradores cambian el estado de una publicación'... '¿Qué hacemos con esa regla?' options 'Excepción solo aquí' / 'Cambiar la regla' / 'Mantenerla' — answer: 'Excepción solo aquí'.
- **S3** asked — Q2 'Estados': '"una publicación tiene un único estado: activa". Tu idea agrega un segundo estado... ¿Qué hacemos con esa regla?' — answer: 'Excepción solo aquí'.

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
| verifier (pass/fail/not-run per round) | 13/0/0 | 16/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 7.30 | 6.29 |
| duration (min) | 21.2 | 22.9 |
| output tokens | 110538 | 95637 |

Planted ambiguities:

- **P1** recorded_assumption — A4 Only the seller who owns the listing may pause or resume it; other sellers, buyers and admins are refused (403), unauthenticated callers 401, unknown listing 404.
- **P2** recorded_assumption — A5 ... hidden from search (GET /listings); detail (GET /listings/:id) still answers and shows status `paused`; ...
- **P3** recorded_assumption — A5 ... new orders on it are refused with a 4xx; orders placed before the pause are unchanged and still listed in GET /orders.
- **P4** recorded_assumption — A3 ... the listing's rank score is left exactly as it was — pausing and resuming never change it ... no snapshot of its old position.
- **P5** recorded_assumption — A6 Pausing an already-paused listing, or resuming one that is active, is refused with a 4xx error (S2 style) and changes nothing.

Contradicted standing decisions:

- **S1** recorded_assumption — A1 Standing decision S1 ("Only admins change a listing's status") contradicts the idea (sellers pause/resume). Set aside for this feature only: the owning seller may move their own listing between `active` and `paused`...
- **S3** recorded_assumption — A2 Standing decision S3 ("A listing has a single status, `active`") contradicts the idea (status `paused`). Set aside for this feature only: a listing's status is `active` or `paused`.

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
| verifier (pass/fail/not-run per round) | 10/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 11 | 12 |
| cost (USD, estimate) | 3.73 | 3.60 |
| duration (min) | 13.4 | 11.7 |
| output tokens | 61815 | 60964 |

Planted ambiguities:

- **P1** asked — Q5 "¿Quién puede pausar y reanudar una publicación? ... Solo su vendedor / Su vendedor y los admins / Cualquier vendedor" → answer "Su vendedor y los admins"
- **P2** asked — Q6 "¿cómo se comportan ... la búsqueda ... ver una publicación por su enlace ... la lista de pedidos ya hechos?" options incl. "Oculta para comprar" → answer "Oculta para comprar"
- **P3** asked — Q6 same question covers ordering: "hacerle un pedido (que hoy además le suma 1 punto de ranking)" among the parts settled by answer "Oculta para comprar" (ordering refused per D6)
- **P4** asked — Q3 "Cuando dices «sin perder su ranking», ¿qué debe conservarse?" options "Conservar el puntaje / Conservar la posición / No lo sé" → answer "Conservar el puntaje"
- **P5** asked — Q7 "¿Qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?" → answer "Se acepta sin cambios"

Contradicted standing decisions:

- **S1** asked — Q2 "solo los administradores cambian el estado de una publicación" ... Tu idea deja que los vendedores pausen y reanuden ... ¿Qué hacemos con esa decisión?" → answer "Dejarla de lado solo aquí"
- **S3** asked — Q1 "una publicación tiene un solo estado, `active`. Tu idea agrega un segundo estado, `paused`. ¿Qué hacemos con esa decisión?" → answer "Dejarla de lado solo aquí"

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
| cost (USD, estimate) | 0.28 | 0.31 |
| duration (min) | 1.2 | 1.3 |
| output tokens | 2228 | 2891 |

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
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 0 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 8.30 | 8.16 |
| duration (min) | 40.4 | 39.5 |
| output tokens | 168497 | 167205 |

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
| cost (USD, estimate) | 8.48 | 8.62 |
| duration (min) | 28.5 | 28.3 |
| output tokens | 103786 | 107462 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
