# Loop state — 000-moderation

UROBOROS: 0.28.0
SPEC-KIT: 1.1.0 (contract baseline 1.1.0)
ACTIVE FLAGS: none (default)
LANGUAGE: Spanish
SIZE: small
STATUS: complete

## Idea (verbatim)

Antes de agregar más funciones a las publicaciones quiero dejar fijas las reglas básicas: qué estados puede tener una publicación, quién puede cambiarlo y cómo responde la API cuando algo no se permite.

## USER MESSAGES

- none

## DECISION LOG

- A listing has a single status, `active`; no other status exists for now. — user: "Solo activa, por ahora" (D1)
- Only admins change a listing's status. — user: "Solo los admins" (D2)
- Refusals keep the API's existing error style, a JSON body { "error": "<snake_case_code>" } with a 4xx status. — user: "El mismo estilo de siempre" (D3)
- No audit history of status changes. — user: "No hace falta" (D4)
- The exact error codes and the body of successful responses are the implementer's choice, in that style. — user: "Que los elija quien lo implemente" (D5)

## ASSUMPTION LOG

- Search (`GET /listings`) lists only listings whose status is `active`. Nobody was asked; it was the conservative reading. (A1)

## DEFERRED

- none

## Phases

### specify — done, CLEAN (r1)
### clarify — done, CLEAN (r1)
### plan — done, CLEAN (r1)
### tasks — done, CLEAN (r1)
### analyze — done
### implement — done, gate green, verification passed
