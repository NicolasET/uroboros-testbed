# uroboros 0.27.0+c4b24c0.dirty

- uroboros: ..\uroboros → 0.27.0 @ c4b24c0 (uncommitted changes)
- roles: claude-opus-5-5 at `medium` effort (the model's default) · Claude Code 2.1.283 · Agent SDK 0.3.283
- scenario: v8 · verifier eval: v2 · reviewer eval: v2 · implement eval: v1 · started: 2026-11-08T20:17:57.157Z
- compared with: default, auto, goal, compat, verify, review → 0.26.0+61a59c3.dirty

### default

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | none | none |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 8/0/0 | 17/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 11 | 14 |
| cost (USD, estimate) | 7.75 | 7.36 |
| duration (min) | 22.4 | 23.8 |
| output tokens | 115658 | 113736 |

Planted ambiguities:

- **P1** asked — Q4: "¿Quién puede pausar y reanudar una publicación?" options incl. "El dueño y los administradores" → answered "El dueño y los administradores"
- **P2** asked — Q6: "¿cómo tratan una publicación pausada las funciones que ya existen? ... si aparece en la búsqueda, si se puede ver su ficha..." → answer "Fuera de venta, ficha visible"
- **P3** asked — Q6 asks whether a paused listing can be bought; answer "Fuera de venta, ficha visible" (fuera de venta = cannot be ordered)
- **P4** asked — Q5: "¿Qué significa «sin perder su ranking»? ... Al reanudar, la lámpara…" options "Conserva su puntaje" / "Vuelve al mismo lugar" → answer "Conserva su puntaje"
- **P5** asked — Q7: "¿qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?" → answer "Se acepta sin cambios"

Contradicted standing decisions:

- **S1** asked — Q2 "Quién cambia": "solo los administradores cambian el estado ... Tu idea deja que los vendedores pausen y reanuden ... ¿Qué hacemos con esa regla?" → answer "Dejarla de lado solo aquí"
- **S3** asked — Q1 "Estado único": "una publicación tiene un único estado: activa ... agrega un segundo estado: «pausada» ¿Qué hacemos con esa regla?" → answer "Dejarla de lado solo aquí"

### auto

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 8/11 | 8/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 13/0/0 | 13/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 6.45 | 7.30 |
| duration (min) | 20.8 | 21.2 |
| output tokens | 94081 | 110538 |

Planted ambiguities:

- **P1** recorded_assumption — A3 Only the owning seller may pause/resume; admins, buyers, other sellers refused. (Q2)
- **P2** recorded_assumption — A4 Readers rule: paused excluded from search, cannot be ordered, detail still returns it with status `paused`; existing orders and order list untouched. (Q3)
- **P3** recorded_assumption — A4 Readers rule: paused excluded from search, cannot be ordered, detail still returns it with status `paused`; existing orders and order list untouched. (Q3)
- **P4** recorded_assumption — A2 "Without losing its ranking" = rank score unchanged by pause/resume; position not frozen. (Q1, refuter: corroborated)
- **P5** recorded_assumption — A5 Pausing a paused listing / resuming an active one is refused with an error (code per S2), nothing changes. (Q5)

Contradicted standing decisions:

- **S1** recorded_assumption — A1 Standing S1 and S3 contradict the idea → set aside for this feature only; decisions.md unchanged. (Q8)
- **S3** recorded_assumption — A1 Standing S1 and S3 contradict the idea → set aside for this feature only; decisions.md unchanged. (Q8)

### goal

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | 5/5 | 5/5 |
| contradicted standing decisions surfaced | 2/2 | 2/2 |
| decisions.md at the end | pass | pass |
| duplicate standing decisions (judge) | none | none |
| "No sé" to a list (lists · items kept) | not exercised | not exercised |
| hidden tests | 11/11 | 11/11 |
| runtime tests (real server) | 3/3 | 3/3 |
| verifier (pass/fail/not-run per round) | 10/0/0 | 10/0/0 |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | ✓ ✓ ✓ | ✓ ✓ ✓ |
| questions asked | 11 | 11 |
| cost (USD, estimate) | 3.64 | 3.73 |
| duration (min) | 13.1 | 13.4 |
| output tokens | 61959 | 61815 |

Planted ambiguities:

- **P1** asked — Q5 'Quién pausa': "Ya decidiste que, como excepción, los vendedores pueden pausar y reanudar... ¿Quién puede pausar o reanudar una publicación concreta?" answer: "Su vendedor y admins"
- **P2** asked — Q4 'Pausada': "Mientras una publicación está pausada, ¿cómo la tratan las partes que ya existen? Hoy la búsqueda muestra todas, el detalle de una publicación muestra cualquiera..." answer: "Oculta para comprar" → D4: detail still answers and shows paused
- **P3** asked — Q4 'Pausada' (same question as P2) answer "Oculta para comprar" → D4: 'does not appear in search and cannot be ordered'
- **P4** asked — Q3 'Ranking': "'Sin perder su ranking', ¿qué tiene que conservar una publicación pausada?" answer: "Conserva el puntaje"
- **P5** asked — Q6 'Repetido': "¿Qué pasa si alguien pausa una publicación que ya está pausada, o reanuda una que ya está activa?" answer: "Funciona sin cambiar nada"

Contradicted standing decisions:

- **S1** asked — Q1 'Quién cambia': "El proyecto tiene una regla fija... 'solo los administradores cambian el estado de una publicación'... ¿Qué hacemos con la regla?" answer: "Excepción solo aquí"
- **S3** asked — Q2 'Estados': "Otra regla fija del proyecto dice: 'una publicación tiene un único estado, active'. Tu idea agrega el estado paused. ¿Qué hacemos con esa regla?" answer: "Excepción solo aquí"

### compat

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
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
| cost (USD, estimate) | 0.30 | 0.28 |
| duration (min) | 1.3 | 1.2 |
| output tokens | 3576 | 2228 |

### verify

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 | route 3/3 · cache 3/3 · status 3/3 · edge 3/3 |
| verifier false failures | clean 0/3 runs · stray fails 0 · not-run 5 | clean 0/3 runs · stray fails 0 · not-run 1 |
| reviewer detection (caught / runs) | - | - |
| reviewer on the clean copy | - | - |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 7.69 | 8.30 |
| duration (min) | 38.8 | 40.4 |
| output tokens | 166336 | 168497 |

### review

| | previous | this run |
|---|---|---|
| end to end | pass | pass |
| ambiguities detected | - | - |
| contradicted standing decisions surfaced | - | - |
| decisions.md at the end | - | - |
| duplicate standing decisions (judge) | - | - |
| "No sé" to a list (lists · items kept) | - | - |
| hidden tests | - | - |
| runtime tests (real server) | - | - |
| verifier (pass/fail/not-run per round) | - | - |
| verifier detection (caught / runs) | - | - |
| verifier false failures | - | - |
| reviewer detection (caught / runs) | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 | untracked 3/3 · skip 3/3 · suppress 3/3 · weakened 3/3 · extra 3/3 · deleted 3/3 · ranking 3/3 |
| reviewer on the clean copy | CLEAN 3/3 runs · findings 0 · risks 0 | CLEAN 3/3 runs · findings 0 · risks 0 |
| gate (test/typecheck/lint) | - | - |
| questions asked | 0 | 0 |
| cost (USD, estimate) | 8.04 | 8.48 |
| duration (min) | 28.1 | 28.5 |
| output tokens | 104355 | 103786 |

## Not proven by this run

- The browser path: testbed sessions load no MCP server, so no UI scenario runs and Claude in Chrome is never used.
- Answers from a real user: the oracle answers from `truth.md` alone and says "No sé" to anything it does not settle.
- Other projects: one fixture (a Node/TypeScript API on spec-kit 1.1.0) and one feature idea.
- The refuter's effect: the reviewer eval scores the reviewer's report before the refuter, which only a full pipeline runs.
