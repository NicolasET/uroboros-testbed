# uroboros 0.22.0+56a5bc1

- uroboros: /home/user/uroboros → 0.22.0 @ 56a5bc1
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v2 · reviewer eval: v1 · started: 2026-10-22T03:18:14.436Z
- compared with: default, auto, goal, compat, verify, review → 0.21.0+49bf109

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 16/0/0 | 15/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 16 |
| cost (USD, estimate) | 6.49 | 6.57 |
| duration (min) | 18.5 | 21.0 |
| output tokens | 102541 | 102058 |

Planted ambiguities:

- **P1** asked — Q: "¿Quién puede pausar y reanudar una publicación?" A: "Dueño y administradores"
- **P2** asked — Q: "...Cuando una publicación está pausada, ¿dónde debe verse?" A: "Oculta en búsqueda, detalle abierto"
- **P3** asked — Q: "...¿Qué pasa con un pedido sobre una publicación pausada?" A: "Se rechaza"
- **P4** asked — Answer to the shared-understanding summary question: "...lo que acordamos es que el puntaje se preserva exactamente pero la posición en búsqueda no está garantizada — otras publicaciones pueden haberla adelantado mientras estuvo pausada."
- **P5** asked — Q: "Acciones repetidas o fuera de lugar: pausar una publicación que ya está pausada, o reanudar una que ya está activa. ¿Qué regla aplica a ambos casos?" A: "Éxito sin cambios"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 11/0/0 | 19/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 4.88 | 5.67 |
| duration (min) | 13.5 | 13.5 |
| output tokens | 78024 | 93460 |

Planted ambiguities:

- **P1** recorded_assumption — A1 Only the seller who owns the listing may pause/resume it; other sellers and buyers → 403 `not_listing_owner`; admins are not given this power (smallest scope).
- **P2** recorded_assumption — A3 A paused listing is excluded from search results (GET /listings) ... A4 GET /listings/:id still returns a paused listing (status `paused`) to anyone, as today (no access change).
- **P3** recorded_assumption — A5 Ordering a paused listing is refused: 409 `listing_paused`. Rank therefore cannot grow while paused.
- **P4** recorded_assumption — A2 Pausing keeps rankScore exactly as it was; resuming restores status `active` with the same rankScore, so the listing returns to the same relative position in search (literal reading of "sin perder su ranking").
- **P5** recorded_assumption — A7 Pausing an already-paused listing → 409 `listing_already_paused`; resuming a listing that is not paused → 409 `listing_not_paused` (no silent no-op).

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 | 11/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 13 |
| cost (USD, estimate) | 3.07 | 3.33 |
| duration (min) | 10.5 | 11.6 |
| output tokens | 52999 | 55851 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación? ... también existe el rol admin." → answer: "Su vendedor dueño y los admin"
- **P2** asked — "Mientras una publicación está pausada, ¿qué ven y qué pueden hacer los demás? ... Esta regla decide esos tres casos a la vez." → answer: "Fuera de búsqueda, detalle visible"
- **P3** asked — Same question as P2 ("...cualquier comprador puede pedirla (POST /listings/:id/orders...)... Esta regla decide esos tres casos a la vez.") → answer: "Fuera de búsqueda, detalle visible" (search excluded, orders rejected per D1/AC-7)
- **P4** asked — Goal draft review answer (Editar): "La TRUTH dice que el rankScore se preserva exactamente, pero que la posición de búsqueda no está garantizada — otros listings pueden haberlo adelantado..." then corrected AC-4 question answered "Aprobar"
- **P5** asked — "¿Qué pasa si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?" → answer: "Éxito sin cambios"

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
| cost (USD, estimate) | 0.27 | 0.21 |
| duration (min) | 0.4 | 0.9 |
| output tokens | 2699 | 2485 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 7.45 | 6.96 |
| duration (min) | 26.7 | 25.5 |
| output tokens | 175221 | 166580 |

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
| cost (USD, estimate) | 5.40 | 5.47 |
| duration (min) | 11.4 | 11.8 |
| output tokens | 77811 | 80573 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
