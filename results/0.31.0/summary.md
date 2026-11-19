# uroboros 0.31.0

- uroboros: v0.31.0 → 0.31.0 @ 027a673
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.327 · Agent SDK 0.3.327
- scenario: v9 · verifier eval: v3 · reviewer eval: v3 · implement eval: v2 · started: 2026-11-18T21:22:07.840Z
- compared with: default, auto, goal, compat → 0.30.0+b3b5ce3.dirty; verify, review → 0.30.1

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 17/0/0 | 17/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 10 | 9 |
| cost (USD, estimate) | 7.07 | 7.32 |
| duration (min) | 19.7 | 23.6 |
| output tokens | 103758 | 123397 |

Planted ambiguities:

- **P1** asked — Q3: "¿Quién puede pausar y reanudar una publicación?" options incl. "Solo su vendedor","Su vendedor y admins","Solo los admins" → answer "Su vendedor y admins"
- **P2** asked — Q7: "¿Quién puede ver la ficha de una publicación pausada?" → "Cualquiera"; Q8: "¿Le sigue apareciendo en la búsqueda a su propio vendedor y a los administradores?" → "No, oculta para todos"
- **P3** asked — Q5: "¿Qué pasa con una publicación mientras está pausada...si los compradores pueden hacerle pedidos...?" → "Oculta a compradores"
- **P4** asked — Q4: "¿qué debe conservar la publicación al reanudarse?" options "Sus puntos"/"Su lugar en la lista"/"No lo sé" → "Sus puntos"
- **P5** asked — Q6: "¿Qué pasa cuando alguien repite una acción sin efecto...?" → "Se acepta sin cambios"

Earlier decisions the idea changes:

- **D1** asked — Q1: "En la función anterior de moderación decidiste que una publicación tiene un solo estado, «activa»...¿Cómo queda la lista de estados de una publicación?" → "Activa y pausada"
- **D2** asked — Q3: "En la función de moderación decidiste que solo los administradores pueden cambiar el estado de una publicación. Esta idea deja que los vendedores pausen y reanuden. ¿Quién puede pausar y reanudar una publicación?" → "Su vendedor y admins"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 13/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.09 | 6.07 |
| duration (min) | 17.1 | 17.1 |
| output tokens | 95613 | 88895 |

Planted ambiguities:

- **P1** recorded_assumption — A2: Only the seller who owns the listing may pause or resume it; anyone else (another seller, a buyer, an admin) is refused (403), a missing/unknown user gets 401.
- **P2** recorded_assumption — A4: a paused listing is left out of search (GET /listings); ... it is still readable by id (GET /listings/:id) showing status `paused` (so the seller can see it and resume it)
- **P3** recorded_assumption — A4: ... ordering it is refused with a 4xx error; it is still readable by id (GET /listings/:id) showing status `paused`
- **P4** recorded_assumption — A3: "Sin perder su ranking" = the stored score (rankScore) is unchanged by pause and by resume; ... The exact former position is not reserved.
- **P5** recorded_assumption — A6: Pausing an already paused listing, or resuming an active listing, is refused with a 4xx error and changes nothing.

Earlier decisions the idea changes:

- **D1** recorded_assumption — A1: A listing can now have the status `paused` in addition to `active`; the idea replaces what 000-moderation D1 decided ("single status `active` for now"). (Q1)
- **D2** recorded_assumption — A2: Only the seller who owns the listing may pause or resume it ... This replaces 000-moderation D2 ("only admins change status") for pause/resume only. (Q2)

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| earlier decisions the idea changes, surfaced | 2/2 | 2/2 |
| earlier decision the idea leaves alone, asked again | no | no |
| "No sé" to a list (lists · items kept) | not exercised | 1 · 3 kept |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 9/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 11 | 11 |
| cost (USD, estimate) | 3.82 | 4.81 |
| duration (min) | 16.4 | 19.9 |
| output tokens | 64360 | 85648 |

Planted ambiguities:

- **P1** asked — Q3 'Quién pausa': '¿Quién puede pausar y reanudar una publicación?' options incl. 'Su vendedor y admins' → answer 'Su vendedor y admins'
- **P2** asked — Q4 'Pausada': '¿Cómo deben tratar estas funciones a una publicación pausada?' → answer 'Oculta, detalle visible' (search hidden, detail still shows status)
- **P3** asked — Q4 options distinguish ordering treatment ('Visible, no se pide' vs chosen 'Oculta, detalle visible'); D4 rule: '...cannot be ordered...' recorded from Q4 answer
- **P4** asked — Q1 'Ranking': '¿qué significa "sin perder su ranking"?' options 'Conserva su puntaje' / 'Conserva su lugar' → answer 'Conserva su puntaje'; refined by Q9/Q10 to note position not guaranteed
- **P5** asked — Q5 'Repetidas': '¿Qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?' → answer 'Se acepta sin cambios'

Earlier decisions the idea changes:

- **D1** asked — Q2 'Estados': 'La función anterior ... decidió que ... no existe ningún otro [estado] por ahora ... ¿Reemplazamos esa regla?' → answer 'Agregar "pausada"'
- **D2** asked — Q3 'Quién pausa': 'La función anterior ... decidió que solo los administradores cambian el estado ... ¿Quién puede pausar y reanudar una publicación?' → answer 'Su vendedor y admins'

Lists answered "No sé": Prioridad

### compat

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 0.31 | 0.34 |
| duration (min) | 1.1 | 1.1 |
| output tokens | 2512 | 2751 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 · rank 3/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 · rank 3/3 |
| verifier detection by a property probe (caught / runs) | edge 0/3 · rank 0/3 | edge 2/3 · rank 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 1 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer detection after the refuter (caught / runs) | - | - |
| reviewer on the clean copies | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 10.32 | 12.15 |
| duration (min) | 53.8 | 57.3 |
| output tokens | 201974 | 245285 |

### review

| | previous | this run |
|---|---|---|
| end to end | FAIL (every run returned a report) | pass |
| ambiguities detected | - | - |
| earlier decisions the idea changes, surfaced | - | - |
| earlier decision the idea leaves alone, asked again | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier detection by a property probe (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 2/3 · ranking 2/3 · rule 0/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 3/3 |
| reviewer detection after the refuter (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 2/3 · ranking 2/3 · rule 0/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 · rule 3/3 |
| reviewer on the clean copies | rule-clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 · clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 | rule-clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 · clean: CLEAN 3/3 runs · findings 0 · risks 0 · after the refuter 0 |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 15.58 | 17.30 |
| duration (min) | 54.7 | 64.1 |
| output tokens | 182943 | 187298 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- What the orchestrator does after the refuter: the reviewer eval scores the reviewer's report and, from uroboros 0.29.0, which of its items survive the refuter, but it asks no question and folds nothing.
