# uroboros 0.20.0+716cc04

- uroboros: /home/user/uroboros → 0.20.0 @ 716cc04
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-21T20:09:50.069Z
- compared with: default, auto, goal, compat, review → 0.19.0+35163f0; verify → 0.19.0

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 15/0/0 | 15/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 11 | 13 |
| cost (USD, estimate) | 5.46 | 6.58 |
| duration (min) | 14.2 | 18.6 |
| output tokens | 84236 | 103321 |

Planted ambiguities:

- **P1** asked — Q: "¿Quién puede pausar y reanudar una publicación? Hoy solo los vendedores publican, y existe un rol admin..." A: "Dueño y también admin"
- **P2** asked — Q: "Mientras una publicación está pausada, ¿qué ven y qué pueden hacer los demás usuarios...? Hoy toda publicación aparece en el buscador (GET /listings), se puede consultar por id (GET /listings/:id)..." A: "Fuera del buscador solamente"; follow-up Q: "...¿También sale para su vendedor dueño y para los admins cuando ellos buscan?" A: "Sale para todos"
- **P3** asked — Q: "...se puede comprar (POST /listings/:id/orders). Esta regla decide esos tres casos a la vez." A: "Fuera del buscador solamente" (decides search, detail, and ordering together); later Q: "Si un comprador intenta comprar una publicación pausada, la compra se rechaza. ¿Qué respuesta recibe?"
- **P4** asked — Prompt-approval Q answer: "La especificación contradice el entendimiento sobre ranking (P4)... Lo que se preserva es el rankScore exactamente, no la posición de búsqueda."
- **P5** asked — Q: "¿Qué pasa si se pide pausar una publicación que ya está pausada, o reanudar una que ya está activa?" A: "Responde OK sin cambios"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 13/0/0 | 11/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 4.67 | 5.19 |
| duration (min) | 11.1 | 11.8 |
| output tokens | 74486 | 79271 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the owning seller may pause/resume; other sellers, buyers, admins → forbidden (403); no/unknown user → unauthenticated (401); unknown listing → not found (404). Rationale: smallest permission surface.
- **P2** recorded_assumption — A4 Paused listings excluded from search. ... A9 GET /listings/:id keeps returning the listing to anyone, with status `paused` (visibility + way back via resume).
- **P3** recorded_assumption — A5 Ordering a paused listing refused with conflict (409); no order, rank unchanged. Rationale: off the market.
- **P4** recorded_assumption — A6 Pause/resume never change rankScore or createdAt; no decay/boost; after resume the listing sorts where its unchanged score places it.
- **P5** recorded_assumption — A7 Pausing a paused listing / resuming a non-paused one → conflict (409), no change. Rationale: explicit over silent.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 12/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 12 | 12 |
| cost (USD, estimate) | 2.67 | 3.05 |
| duration (min) | 9.4 | 9.9 |
| output tokens | 46616 | 53280 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación?..." → answer "Dueño y admins"
- **P2** asked — "Mientras está pausada, ¿la publicación aparece en la búsqueda (GET /listings)?..." → answer "Oculta de la búsqueda"
- **P3** asked — "¿Se puede comprar (POST /listings/:id/orders) una publicación pausada?..." → answer "Rechazar compras"
- **P4** asked — Summary question claimed listing "vuelve exactamente a su posición en la búsqueda"; user corrected: "el rankScore se preserva exactamente, pero su posición en búsqueda no está garantizada porque otras publicaciones pueden haberla adelantado mientras estuvo pausada" (recorded as D9)
- **P5** asked — "Regla para acciones repetidas: ¿qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?..." → answer "Éxito sin cambios"

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
| cost (USD, estimate) | 0.32 | 0.23 |
| duration (min) | 0.5 | 0.4 |
| output tokens | 2882 | 2246 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 0/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 2 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 4.99 | 6.93 |
| duration (min) | 15.9 | 27.0 |
| output tokens | 104531 | 163701 |

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
| cost (USD, estimate) | 5.45 | 5.61 |
| duration (min) | 12.0 | 12.0 |
| output tokens | 78754 | 82608 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
