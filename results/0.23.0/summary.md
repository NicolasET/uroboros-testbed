# uroboros 0.23.0

- uroboros: v0.23.0 → 0.23.0 @ e806b4a
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v7 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-23T04:31:43.497Z
- compared with: default, auto, goal, compat → 0.22.1

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| "No sé" to a list (lists · items kept) | 1 · 0 kept | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 16/0/0 | 17/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 16 |
| cost (USD, estimate) | 7.52 | 6.00 |
| duration (min) | 22.5 | 18.9 |
| output tokens | 116555 | 99165 |

Planted ambiguities:

- **P1** asked — Q5: "¿Quién puede pausar y reanudar una publicación?" — answer: "Su vendedor dueño y los admins"
- **P2** asked — Q3: "...si aparece en la búsqueda..., quién puede ver su detalle..." — answer: "Fuera del mercado, detalle visible"
- **P3** asked — Q3: "...y si los compradores pueden hacer pedidos nuevos..." — answer: "Fuera del mercado, detalle visible" (fuera del mercado = no new orders)
- **P4** asked — Q13 open decision #4: "What 'without losing its ranking' means exactly..." resolved in the same answer: "(4) Ranking: rankScore se preserva exacto; posición en búsqueda no garantizada tras reanudar."
- **P5** asked — Q6: "Regla para acciones repetidas... ¿Qué debe pasar?" — answer: "Éxito sin cambios"

Contradicted standing decisions:

- **S1** asked — Q2: "solo los administradores cambian el status de una publicación" ... (S1) — answer: "Dejarla de lado solo aquí"
- **S3** asked — Q1: "una publicación tiene un único status, `active`" ... (S3) — answer: "Dejarla de lado solo aquí"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 14/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.88 | 7.20 |
| duration (min) | 18.8 | 18.9 |
| output tokens | 92942 | 118298 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the listing's owning seller may pause/resume. Buyers, other sellers and admins are refused (403); unauthenticated callers 401; unknown listing 404.
- **P2** recorded_assumption — A4 A paused listing is excluded from search results (GET /listings)... A5 A paused listing is still returned by GET /listings/:id... with status `paused`.
- **P3** recorded_assumption — A6 New orders on a paused listing are refused (4xx, S2 style); existing orders are untouched and GET /orders is unchanged.
- **P4** recorded_assumption — A7 "Without losing ranking": pause and resume leave rankScore and createdAt unchanged; on resume the listing reappears in search exactly where its unchanged rank places it.
- **P5** recorded_assumption — A8 Rule for repeated/invalid transitions: pausing a listing already paused, or resuming a listing that is not paused, is refused with a 409 and an error body, no change.

Contradicted standing decisions:

- **S1** recorded_assumption — A2 Standing decision "only admins change a listing's status" (S1) is set aside for this feature only, narrowly: a seller may pause/resume their OWN listings; every other status change stays admin-only.
- **S3** recorded_assumption — A1 Standing decision "a listing has a single status, active" (S3) is set aside for this feature only — the user's idea explicitly adds status `paused`; .uroboros/decisions.md is NOT edited.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| "No sé" to a list (lists · items kept) | 1 · 0 kept | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 | 12/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 16 | 12 |
| cost (USD, estimate) | 3.26 | 3.29 |
| duration (min) | 14.1 | 11.2 |
| output tokens | 58177 | 59603 |

Planted ambiguities:

- **P1** asked — Q5 'Quién': "¿Quién puede pausar y reanudar una publicación?" options "Solo el vendedor dueño" / "Dueño y admins" — answered "Dueño y admins".
- **P2** asked — Q3 'Pausada' asks what others see/can do while paused (search, detail, buy) — answered "Fuera del mercado" (D3: not in search, detail still shows paused).
- **P3** asked — Q3 'Pausada' includes "se puede comprar (POST /listings/:id/orders) cualquiera" among options; answer "Fuera del mercado" settles ordering is refused (D3).
- **P4** asked — Q9 answer: "lo que quiero es que el rankScore se preserve exactamente — no que la posición de búsqueda sea garantizada... no necesariamente en el mismo sitio donde estaba antes de pausa."
- **P5** asked — Q6 'Repetidas': "¿Qué pasa con las acciones repetidas... pausar una ya pausada, o reanudar una ya activa?" — answered "Responden éxito".

Contradicted standing decisions:

- **S1** asked — Q1 'Permisos': "Hay una decisión vigente... Solo los administradores cambian el status... ¿Qué hacemos con esa regla?" — answered "Excepción solo aquí".
- **S3** asked — Q2 'Status': "Hay otra decisión vigente que dice: 'Una publicación tiene un único status, active'... ¿Qué hacemos con esa regla?" — answered "Excepción solo aquí".

### compat

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
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
| cost (USD, estimate) | 0.38 | 0.28 |
| duration (min) | 1.0 | 1.2 |
| output tokens | 2245 | 2856 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- Modes not measured in this result: verify, review.
