# uroboros 0.12.1

- uroboros: ../uroboros → 0.12.1 @ 2aca86f
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v2 · started: 2026-09-27T20:50:21.607Z
- compared with: nothing yet — this is the first result

### default

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 11/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 13 |
| cost (USD, estimate) | 4.73 |
| duration (min) | 14.6 |
| output tokens | 80360 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación? ... " answered "Dueño y admins"
- **P2** asked — "Mientras está pausada, ¿la publicación aparece en la búsqueda (GET /listings)?" -> "Oculta de la búsqueda"; "Consultada directamente (GET /listings/:id), ¿qué pasa con una publicación pausada?" -> "Visible para todos"
- **P3** asked — "¿Se puede pedir (POST /listings/:id/orders) una publicación pausada? ..." answered "Rechazar pedidos"
- **P4** asked — "Algo no cuadra: Al reanudar, el ranking score se conserva intacto, pero su posición de búsqueda no está garantizada — otros listados pueden haberlo superado mientras estuvo pausado."
- **P5** asked — "¿Qué pasa si se pide pausar una publicación que ya está pausada (o reanudar una que ya está activa)?" answered "Éxito sin cambios"

### auto

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 8/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 0 |
| cost (USD, estimate) | 4.49 |
| duration (min) | 11.5 |
| output tokens | 77125 |

Planted ambiguities:

- **P1** recorded_assumption — A1 — Only the owning seller may pause/resume; other sellers, buyers, admins → 403; no/unknown user → 401. (smallest scope)
- **P2** recorded_assumption — A2 — Paused listings are hidden from search. (minimal meaning of "pause") / A4 — GET /listings/:id still returns a paused listing showing `paused`.
- **P3** recorded_assumption — A3 — Paused listings cannot receive new orders (409). (a paused publication is not purchasable)
- **P4** recorded_assumption — A5 — Rank score and createdAt untouched by pause/resume; no decay/boost; resumed listing sits where its score puts it.
- **P5** recorded_assumption — A6 — Pause-when-paused / resume-when-not-paused → 409, listing unchanged (not a silent no-op).

### goal

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 11/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 11 |
| cost (USD, estimate) | 1.74 |
| duration (min) | 7.4 |
| output tokens | 32641 |

Planted ambiguities:

- **P1** asked — Q: '¿Quién puede pausar y reanudar una publicación?' A: 'Dueño y admins'
- **P2** asked — Q: '¿Qué pasa con una publicación pausada en la búsqueda?' A: 'Oculta de la búsqueda'; Q: '...GET /listings/:id... publicación pausada?' A: 'Se ve con status paused'
- **P3** asked — Q: '¿Se puede pedir una publicación pausada?' A: 'Rechazar el pedido'
- **P4** asked — User correction on summary: 'La frase sobre volver a su posición es ambigua. Lo que se preserva exactamente es el rankScore, pero la posición en búsqueda no está garantizada—otros anuncios pueden haberla adelantado.'
- **P5** asked — Q: '¿Qué pasa si se pide pausar una publicación que ya está pausada, o reanudar una que ya está activa?' A: 'Éxito sin cambios'

### compat

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | - |
| hidden tests | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 0.28 |
| duration (min) | 0.5 |
| output tokens | 3170 |
