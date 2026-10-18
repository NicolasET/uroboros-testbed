# uroboros 0.15.0

- uroboros: v0.15.0 → 0.15.0 @ 243c7ba
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v6 · verifier eval: v1 · started: 2026-10-18T00:09:02.011Z
- compared with: nothing yet — this is the first result

### default

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 11/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 15 |
| cost (USD, estimate) | 6.50 |
| duration (min) | 22.0 |
| output tokens | 101104 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación? ... existe además un rol de administrador." → answer: "Dueño y administradores"
- **P2** asked — "¿Una publicación pausada debe aparecer en la búsqueda?" → "Oculta para todos"; and "¿Qué pasa con el detalle de una publicación pausada?" → "Visible para todos"
- **P3** asked — "¿Se pueden hacer pedidos nuevos sobre una publicación pausada?" → "Rechazar pedidos nuevos"
- **P4** asked — Approved specify prompt (answer "Aprobar"): "Ranking is preserved: pausing and resuming never change the listing's rank score or its creation date ... On resume the listing reappears in search in the position its preserved score gives it."
- **P5** asked — "¿Qué debe pasar con acciones repetidas o sin efecto? ... pausar una publicación que ya está pausada, y reanudar una que ya está activa." → "Éxito sin cambios"

### auto

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 8/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 0 |
| cost (USD, estimate) | 4.78 |
| duration (min) | 14.0 |
| output tokens | 80082 |

Planted ambiguities:

- **P1** recorded_assumption — A2 Who may pause/resume: only the owning seller. Unauthenticated -> 401; any other user (other seller, buyer, admin) -> 403.
- **P2** recorded_assumption — A4 Paused listings are left out of search results. ... A6 Fetching a paused listing by id still works for anyone, shows status paused.
- **P3** recorded_assumption — A5 Buyers cannot order a paused listing (conflict error); existing orders untouched. Rationale: pause = not purchasable; least side effects.
- **P4** recorded_assumption — A3 Ranking preserved: pause/resume leave rank score and creation date untouched; after resume it sorts where its score puts it, no decay/boost.
- **P5** recorded_assumption — A7 Repeated action (pause when paused / resume when not paused) refused with conflict, no change. Rationale: explicit over silent.

### goal

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 11/11 |
| runtime tests (real server) | 3/3 |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 16 |
| cost (USD, estimate) | 2.21 |
| duration (min) | 11.3 |
| output tokens | 37186 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación? ..." → "Dueño y admins"
- **P2** asked — "¿Qué pasa con una publicación pausada en la búsqueda?" → "Oculta en la búsqueda"; and "¿Quién puede ver una publicación pausada por su id?" → "Cualquiera"
- **P3** asked — "¿Se puede pedir una publicación pausada?" → "Rechazar el pedido"
- **P4** asked — Shared-understanding check answer: "Punto 5 es incorrecto — el rankScore se preserva al reanudar, pero la posición de búsqueda no está garantizada porque otras publicaciones pueden haberse adelantado."
- **P5** asked — "Regla para acciones repetidas: ¿qué responde la API si se pausa una publicación que ya está pausada, o se reanuda una que ya está activa?" → "Éxito sin cambios"

### compat

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| hidden tests | - |
| runtime tests (real server) | - |
| verifier (pass/fail/not-run per round) | - |
| verifier detection (caught / runs) | - |
| verifier false failures | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 0.30 |
| duration (min) | 0.6 |
| output tokens | 2824 |

### verify

NOT APPLICABLE — this uroboros version ships no verifier agent.
