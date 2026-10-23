# uroboros 0.22.1

- uroboros: v0.22.1 → 0.22.1 @ c6bb485
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v7 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-23T03:32:15.117Z
- compared with: default, auto, goal, compat → nothing yet

### default

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| contradicted standing decisions surfaced | 2/2 |
| decisions.md at the end | pass |
| "No sé" to a list (lists · items kept) | 1 · 0 kept |
| hidden tests | 11/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | 16/0/0 |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 14 |
| cost (USD, estimate) | 7.52 |
| duration (min) | 22.5 |
| output tokens | 116555 |

Planted ambiguities:

- **P1** asked — Q5: "¿Quién exactamente puede pausar y reanudar una publicación?" options: Solo su vendedor / Su vendedor y admins / Cualquier vendedor — answer: "Su vendedor y admins" (owner seller + admins; others refused).
- **P2** asked — Q3: "Mientras una publicación está pausada, ¿qué ven y pueden hacer los demás?" options distinguish 'Oculta y sin pedidos' (hidden from search, no orders) from 'Invisible del todo' (fully invisible incl. detail) — answer 'Oculta y sin pedidos' keeps detail by id answering, confirmed by Q8 answer 'Oculta para todos' (search only).
- **P3** asked — Q3 answer "Oculta y sin pedidos" settles that a buyer cannot order a paused listing (sin pedidos = no orders), among search (GET /listings), detail (GET /listings/:id) and order (POST .../orders).
- **P4** asked — Q9 resumen: "Ranking: pausar y reanudar no cambian su puntaje de ranking ni su fecha de creación; al reanudar vuelve a la búsqueda en la posición que le da ese puntaje." — answer "Coincide".
- **P5** asked — Q6: "Regla para acciones repetidas o fuera de orden: pausar una publicación que ya está pausada, o reanudar una que ya está activa ... ¿Qué debe pasar?" options Error de conflicto / Éxito sin cambios — answer "Éxito sin cambios".

Contradicted standing decisions:

- **S1** asked — Q2: "Otra decisión vigente dice: 'Solo los administradores cambian el status de una publicación'. Tu idea deja que los vendedores pausen y reanuden. ¿Qué hacemos con esa decisión?" — answer "Ignorarla solo aquí".
- **S3** asked — Q1: "Hay una decisión vigente del proyecto que dice: 'Una publicación tiene un solo status, active'. Tu idea agrega el status paused, así que la contradice. ¿Qué hacemos con esa decisión?" — answer "Ignorarla solo aquí".

Lists answered "No sé": Open cases

### auto

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| contradicted standing decisions surfaced | 2/2 |
| decisions.md at the end | pass |
| "No sé" to a list (lists · items kept) | not exercised |
| hidden tests | 8/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | 14/0/0 |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 0 |
| cost (USD, estimate) | 5.88 |
| duration (min) | 18.8 |
| output tokens | 92942 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the owning seller may pause/resume; buyers, other sellers, admins refused (forbidden). Rationale: smallest scope.
- **P2** recorded_assumption — A4 Paused listings hidden from search for everyone, owner included. A5 Paused listing readable at GET /listings/:id with status paused.
- **P3** recorded_assumption — A6 New orders on paused listing refused; existing orders and GET /orders unchanged. Rationale: no new sales; nothing beyond the idea.
- **P4** recorded_assumption — A7 Rank preserved: rank score and creation date untouched by pause/resume. Rationale: literal.
- **P5** recorded_assumption — A8 Pause on paused / resume on active refused with an error, no change. Rationale: explicit over silent.

Contradicted standing decisions:

- **S1** recorded_assumption — A1 Standing "only admins change a listing's status" (S1) set aside for this feature only: owning seller may pause/resume. Standing file unchanged. Rationale: idea requires it; reversible.
- **S3** recorded_assumption — A2 Standing "a listing has a single status, active" (S3) set aside for this feature only: `paused` added. Rationale: idea names it literally.

### goal

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| contradicted standing decisions surfaced | 2/2 |
| decisions.md at the end | pass |
| "No sé" to a list (lists · items kept) | 1 · 0 kept |
| hidden tests | 11/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| reviewer detection (caught / runs) | - |
| reviewer on the clean copy | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 16 |
| cost (USD, estimate) | 3.26 |
| duration (min) | 14.1 |
| output tokens | 58177 |

Planted ambiguities:

- **P1** asked — Q5: "¿Quién puede pausar y reanudar una publicación?" ... answer: "Dueño y admins" (owning seller and any admin; others refused).
- **P2** asked — Q6: "...si aparece en la búsqueda... si se puede ver su detalle..." answer: "Fuera de búsqueda, detalle visible".
- **P3** asked — Q6 also covers: "...si se le pueden hacer pedidos nuevos (hoy no se revisa el status al pedir)." answer: "Fuera de búsqueda, detalle visible" (no pedible).
- **P4** asked — Q10 answer: "El ranking no vuelve a la 'misma posición' — el puntaje se preserva intacto, pero otros listings pueden haberla adelantado... su posición en búsqueda no está garantizada."
- **P5** asked — Q8: "¿qué responde la API al pausar una publicación que ya está pausada, o al reanudar una que ya está activa?" answer: "Éxito sin cambios".

Contradicted standing decisions:

- **S1** asked — Q2/Q5: "solo los admins cambian el status... ¿Qué hacemos con esa regla?" answer: "Cambiarla para el proyecto"; Q5 sets the new rule to owner+admins.
- **S3** asked — Q1: "una publicación tiene un único status, active... ¿Qué hacemos con esa regla?" answer: "Quiero retirar esa regla del proyecto."

Lists answered "No sé": Casos sueltos

### compat

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| contradicted standing decisions surfaced | - |
| decisions.md at the end | - |
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
| cost (USD, estimate) | 0.38 |
| duration (min) | 1.0 |
| output tokens | 2245 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- Modes not measured in this result: verify, review.
