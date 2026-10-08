# uroboros 0.14.0+e731107.dirty

- uroboros: ../uroboros → 0.14.0 @ e731107 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v5 · started: 2026-10-08T06:39:32.670Z
- compared with: 0.13.0 (claude-opus-5-5 at medium)

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 15 | 17 |
| cost (USD, estimate) | 5.20 | 5.83 |
| duration (min) | 15.3 | 16.7 |
| output tokens | 79441 | 88111 |

Planted ambiguities:

- **P1** asked — Q: "¿Quién puede pausar y reanudar una publicación?" A: "Su vendedor y los admins"
- **P2** asked — Q: "¿Qué pasa con una publicación pausada en la búsqueda?" A: "Oculta para todos"; and Q: "¿Qué pasa si alguien la pide directamente por su id?" A: "Visible para todos"
- **P3** asked — Q: "¿Se puede pedir una publicación pausada?" A: "No, se rechaza"
- **P4** asked — Summary confirmation question answered: "Algo no cuadra: El puntaje de ranking se conserva exactamente al pausar y reanudar, pero no está garantizado que vuelva a su posición anterior en la búsqueda; otras publicaciones podrían haber avanzado mientras tanto."
- **P5** asked — Q: "Regla para acciones repetidas o fuera de lugar: pausar una publicación ya pausada, o reanudar una que ya está activa. ¿Qué responde la API?" A: "Éxito sin cambios"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 8/11 | 8/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 4.90 | 5.17 |
| duration (min) | 15.5 | 14.1 |
| output tokens | 77688 | 81509 |

Planted ambiguities:

- **P1** recorded_assumption — A1 Who may pause/resume: only the seller who owns the listing. Admins, other sellers, buyers → 403; missing/unknown user → 401; unknown listing → 404.
- **P2** recorded_assumption — A2 Visibility while paused: a paused listing is excluded from search (GET /listings) for everyone; GET /listings/:id still returns it (with status `paused`).
- **P3** recorded_assumption — A3 Ordering a paused listing is refused (409, error `listing_paused`); existing orders on it are untouched.
- **P4** recorded_assumption — A4 Ranking preservation: pause/resume never change rankScore or createdAt; on resume the listing returns to the search position its rankScore and createdAt give it.
- **P5** recorded_assumption — A5 Repeated actions: pausing an already-paused listing or resuming an active one is refused with 409 (`listing_already_paused` / `listing_not_paused`), no change.

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| hidden tests | 11/11 | 11/11 |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 14 | 12 |
| cost (USD, estimate) | 2.01 | 1.91 |
| duration (min) | 10.6 | 8.1 |
| output tokens | 36806 | 33305 |

Planted ambiguities:

- **P1** asked — ¿Quién puede pausar y reanudar una publicación?... — Answer: "Dueño o admin"
- **P2** asked — "¿Qué pasa con una publicación pausada en la búsqueda?" → "No aparece"; and "¿Y si alguien la pide directamente por su id?" → "Visible para todos"
- **P3** asked — "¿Se puede pedir una publicación pausada?" — Answer: "No, se rechaza"
- **P4** asked — Summary question answer: "El ranking (puntos) se preserva exactamente al pausar y reanudar, pero su posición en búsqueda no es garantizada — otras publicaciones pueden haber avanzado mientras estaba pausada."
- **P5** asked — "Regla para acciones repetidas... pausar una publicación que ya está pausada, o reanudar una que ya está activa. ¿Qué responde la API?" — Answer: "Éxito sin cambios"

### compat

| | previous | this run |
|---|---|---|
| end to end | FAIL (verdict covered; no CHANGED or MISSING row) | pass |
| ambiguities detected | - | - |
| hidden tests | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 0.39 | 0.30 |
| duration (min) | 1.1 | 0.8 |
| output tokens | 5502 | 3830 |
