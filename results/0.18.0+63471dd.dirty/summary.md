# uroboros 0.18.0+63471dd.dirty

- uroboros: ..\uroboros → 0.18.0 @ 63471dd (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v1 · reviewer eval: v1 · started: 2026-10-21T06:17:01.268Z
- compared with: default, auto, goal, compat, verify, review → 0.17.0+94b45c4.dirty

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 16/0/0 | 21/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 16 | 16 |
| cost (USD, estimate) | 6.81 | 6.85 |
| duration (min) | 21.9 | 23.3 |
| output tokens | 104039 | 113274 |

Planted ambiguities:

- **P1** asked — ¿Quién puede pausar y reanudar una publicación? Hoy solo el rol vendedor puede crear publicaciones... Answer: "Dueño y administradores"
- **P2** asked — Regla general: ¿qué significa 'pausada' para los compradores? Decide a la vez tres casos: si aparece en la búsqueda (GET /listings), si se puede ver su detalle (GET /listings/:id)... Answer: "Oculta, pero accesible por enlace"
- **P3** asked — Same question as P2 also decides '...y si se puede pedir (POST /listings/:id/orders)'; Answer: "Oculta, pero accesible por enlace" (covers search/detail/order together)
- **P4** asked — User correction on summary question: "Algo no cuadra: En punto (5), aunque el puntaje de ranking se preserva exactamente, la posición en búsqueda no está garantizada porque otras publicaciones pueden haberla adelantado mientras estuvo pausada."
- **P5** asked — Regla para acciones repetidas: ¿qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa? Answer: "Se acepta sin cambios"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 14/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 5.29 | 6.46 |
| duration (min) | 14.2 | 17.3 |
| output tokens | 85287 | 95303 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the owning seller may pause/resume; buyers, other sellers, admins refused — smallest scope consistent with "los vendedores".
- **P2** recorded_assumption — A5 Paused listings excluded from search for everyone — pausing means it stops being offered. A6 GET /listings/:id still returns a paused listing with status `paused`.
- **P3** recorded_assumption — A7 New orders on a paused listing refused; existing orders untouched — no new behavior beyond the idea.
- **P4** recorded_assumption — A8 Pause/resume never change rankScore or createdAt — "sin perder su ranking".
- **P5** recorded_assumption — A9 Pause of a paused listing / resume of an active one refused as conflict, nothing changes — conservative.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 11/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 10 |
| cost (USD, estimate) | 2.69 | 2.62 |
| duration (min) | 12.7 | 9.3 |
| output tokens | 45606 | 44986 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación?" → "El dueño y los admins" (D2)
- **P2** asked — "¿Qué debería ver y poder hacer cualquiera que no sea el vendedor dueño cuando la publicación está pausada?" → "Fuera de búsqueda, detalle visible"; and "...¿Y para su vendedor dueño y para los admins, aparece en la búsqueda (GET /listings)?" → "Fuera para todos" (D1, D5)
- **P3** asked — Confirmation question lists "pedido sobre publicación pausada → 409 'listing_paused'" and asks "¿Los dejo así?" → "Todos quedan así" (D7)
- **P4** asked — Summary question states rankScore behavior; user corrects: "Algo no cuadra: Al reanudar...el rankScore se preserva exactamente igual, pero su posición en búsqueda no está garantizada porque otros listados pueden haber superado este mientras estuvo pausada." (D8)
- **P5** asked — "¿Qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?" → "Responde OK sin cambios" (D3)

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
| cost (USD, estimate) | 0.28 | 0.27 |
| duration (min) | 0.7 | 0.7 |
| output tokens | 2914 | 2718 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 | route 3/3 · cache 3/3 · status 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 4.03 | 4.06 |
| duration (min) | 15.4 | 14.0 |
| output tokens | 77601 | 77700 |

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
| cost (USD, estimate) | 5.48 | 5.55 |
| duration (min) | 12.8 | 12.5 |
| output tokens | 74474 | 75044 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
