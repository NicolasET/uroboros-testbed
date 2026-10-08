# uroboros 0.13.0

- uroboros: v0.13.0 → 0.13.0 @ e731107
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v5 · started: 2026-10-08T05:55:48.093Z
- compared with: nothing yet — this is the first result

### default

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 11/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 15 |
| cost (USD, estimate) | 5.20 |
| duration (min) | 15.3 |
| output tokens | 79441 |

Planted ambiguities:

- **P1** asked — Q: "¿Quién puede pausar y reanudar una publicación?" A: "El dueño y los admins"
- **P2** asked — Q: "...¿qué debe pasar en la búsqueda?" A: "Ocultarla de la búsqueda"; Q: "...¿Qué pasa cuando alguien abre el detalle de una publicación pausada?" A: "Visible para todos"
- **P3** asked — Q: "¿Qué pasa si un comprador intenta pedir una publicación pausada?" A: "Rechazar el pedido"
- **P4** asked — Summary-check answer: "Algo no cuadra: La posición en búsqueda no está garantizada al reanudar. El `rankScore` se preserva intacto, pero... la posición de búsqueda puede cambiar."
- **P5** asked — Q: "Acciones repetidas o sin efecto: pausar una publicación que ya está pausada, o reanudar una que ya está activa. ¿Qué regla aplica a ambos casos?" A: "Éxito sin cambios"

### auto

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 8/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 0 |
| cost (USD, estimate) | 4.90 |
| duration (min) | 15.5 |
| output tokens | 77688 |

Planted ambiguities:

- **P1** recorded_assumption — A1 Only the seller who owns the listing may pause/resume it; any other user (other seller, buyer, admin) gets 403; no x-user-id/unknown user gets 401; unknown listing gets 404.
- **P2** recorded_assumption — A2 Paused listings are excluded from GET /listings search results... A3 GET /listings/:id still returns a paused listing (status `paused`), unchanged behavior.
- **P3** recorded_assumption — A4 Buyers cannot place orders on a paused listing (409 Conflict, error code `listing_paused`).
- **P4** recorded_assumption — A5 Pause and resume never modify rankScore or createdAt; after resume the listing sorts exactly where its unchanged rankScore puts it.
- **P5** recorded_assumption — A6 Pausing an already paused listing, or resuming a listing that is not paused, is rejected with 409 (`listing_already_paused` / `listing_not_paused`) and changes nothing.

### goal

| | this run |
|---|---|
| end to end | pass |
| ambiguities detected | 5/5 |
| hidden tests | 11/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ |
| questions asked | 14 |
| cost (USD, estimate) | 2.01 |
| duration (min) | 10.6 |
| output tokens | 36806 |

Planted ambiguities:

- **P1** asked — "¿Quién puede pausar y reanudar una publicación?" — answer: "Su vendedor y admins"
- **P2** asked — "Mientras una publicación está pausada, ¿debe aparecer en la búsqueda?" → "Oculta para todos"; "¿Qué debe pasar al pedir el detalle de una publicación pausada?" → "Visible para todos"
- **P3** asked — "¿Qué pasa si un comprador intenta pedir una publicación pausada?" — answer: "Se rechaza"
- **P4** asked — Summary question: "El ranking (rankScore) no cambia al pausar ni al reanudar; al reanudar vuelve a su posición de búsqueda según ese ranking." — answer: "Coincide"
- **P5** asked — "Acciones repetidas: pausar una publicación que ya está pausada, o reanudar una que ya está activa. ¿Qué regla aplica a ambos casos?" — answer: "Éxito sin cambios"

### compat

| | this run |
|---|---|
| end to end | FAIL (verdict covered; no CHANGED or MISSING row) |
| ambiguities detected | - |
| hidden tests | - |
| gate (test/typecheck/lint) | - |
| questions asked | 0 |
| cost (USD, estimate) | 0.39 |
| duration (min) | 1.1 |
| output tokens | 5502 |
