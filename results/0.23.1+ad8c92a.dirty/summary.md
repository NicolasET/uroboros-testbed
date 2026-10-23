# uroboros 0.23.1+ad8c92a.dirty

- uroboros: ..\uroboros → 0.23.1 @ ad8c92a (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v7 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-23T05:47:18.745Z
- compared with: default, auto, goal, compat → 0.23.0

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | - | none |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 17/0/0 | 16/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 16 | 15 |
| cost (USD, estimate) | 6.00 | 6.35 |
| duration (min) | 18.9 | 20.9 |
| output tokens | 99165 | 99044 |

Planted ambiguities:

- **P1** asked — Q5 'Permisos': '¿Quién puede pausar y reanudar una publicación?' → Answer: 'Dueño y administradores'
- **P2** asked — Q6 'Visibilidad': '¿cómo se ve una publicación pausada...' (covers search, detail, orders) → Answer: 'Oculta en búsqueda, detalle público'
- **P3** asked — Q10 Resumen, confirmed 'Coincide': 'Pausada: no aparece en la búsqueda; el detalle por id sigue público mostrando `paused`; no acepta pedidos nuevos.'
- **P4** asked — Q3 'Ranking': '"Sin perder su ranking" ¿qué significa al reanudar?' → Answer: 'Conserva el puntaje' (position not guaranteed, per options)
- **P5** asked — Q7 'Repetidas': 'pausar...ya está pausada, o reanudar...ya está activa. ¿Qué responde la API?' → Answer: 'Éxito sin cambios'

Contradicted standing decisions:

- **S1** asked — Q1 'Quién cambia': 'Solo los administradores cambian el estado...¿Qué hacemos con esa regla?' → Answer: 'Excepción solo aquí'
- **S3** asked — Q2 'Estados': 'Una publicación tiene un único estado, `active`...¿Qué hacemos con esa regla?' → Answer: 'Excepción solo aquí'

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
| verifier (pass/fail/not-run per round) | 13/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 7.20 | 5.75 |
| duration (min) | 18.9 | 16.9 |
| output tokens | 118298 | 87909 |

Planted ambiguities:

- **P1** recorded_assumption — A4 Only the seller who owns the listing may pause/resume it; buyers, other sellers and admins are refused (403); unauthenticated callers 401.
- **P2** recorded_assumption — A5 Paused listings do not appear in GET /listings search results... A7 GET /listings/:id keeps returning a paused listing to any caller... with status `paused`.
- **P3** recorded_assumption — A6 A paused listing cannot be ordered: POST /listings/:id/orders on it is refused with a 4xx error and no order is created and rank is not boosted.
- **P4** recorded_assumption — A8 Pausing and resuming leave rankScore unchanged; once resumed, the listing sorts in search exactly where its unchanged rankScore (and existing tie-break) places it.
- **P5** recorded_assumption — A9 Pausing an already-paused listing, or resuming a listing that is not paused, is refused with a 4xx error and changes nothing. Unknown listing → 404.

Contradicted standing decisions:

- **S1** recorded_assumption — A2 Standing decision "Only admins change a listing's status" (S1) is set aside for this feature only — the idea explicitly lets sellers pause/resume; the standing file is not changed.
- **S3** recorded_assumption — A3 Standing decision "A listing has a single status, `active`" (S3) is set aside for this feature only — the idea explicitly adds status `paused`; standing file unchanged.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | - | none |
| "No sé" to a list (lists · items kept) | not exercised | 1 · 2 kept |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 12/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 12 | 14 |
| cost (USD, estimate) | 3.29 | 3.80 |
| duration (min) | 11.2 | 15.1 |
| output tokens | 59603 | 65297 |

Planted ambiguities:

- **P1** asked — Q5: "¿Quién puede pausar y reanudar una publicación?" → answer "Dueño y administradores" (D5: owning seller and any admin; everyone else gets 403).
- **P2** asked — Q6/D6: "Fuera de búsqueda, sin pedidos" — not in search; detail still shows it with status `paused`; existing orders unchanged.
- **P3** asked — Q6/D6: "Fuera de búsqueda, sin pedidos" — refuses new orders (4xx) on a paused listing.
- **P4** asked — Q8 summary: "El ranking (puntaje) no cambia al pausar ni al reanudar; al reanudar vuelve a la búsqueda en la posición que le da ese puntaje." → answer "Coincide".
- **P5** asked — Q7/D7: "Éxito sin cambios" — pausing a paused listing or resuming an active one answers success with the listing as is; nothing changes.

Contradicted standing decisions:

- **S1** asked — Q2: "Otra decisión vigente dice: 'Solo los administradores cambian el status...' ¿Qué hacemos con esa regla?" → answer "Excepción solo aquí" (D2).
- **S3** asked — Q1: "El proyecto tiene una decisión vigente: 'Una publicación tiene un único status, active'... ¿Qué hacemos con esa regla?" → answer "Excepción solo aquí" (D1).

Lists answered "No sé": Sin decidir

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
| cost (USD, estimate) | 0.28 | 0.28 |
| duration (min) | 1.2 | 1.1 |
| output tokens | 2856 | 2273 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- Modes not measured in this result: verify, review.
