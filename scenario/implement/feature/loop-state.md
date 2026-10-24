# Loop state — 001-order-lifecycle

FEATURE: 001-order-lifecycle
BRANCH: 001-order-lifecycle
FEATURE_DIR: specs/001-order-lifecycle
BASE BRANCH: main @ {{BASE_SHA}}
SESSION: 5b0f2c1e-8d4a-4c7e-9a3b-2f6d1e7c4a90
RUN SIZE: standard (round cap 3)

## IDEA (verbatim)
Quiero que los compradores puedan cancelar un pedido abierto, que el vendedor de la publicación pueda marcarlo como entregado, y que el comprador, el vendedor y los administradores puedan ver el detalle de un pedido. Agrégalo a la API como `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` y `GET /orders/:id`.

UROBOROS: {{UROBOROS_VERSION}}

## ACTIVE FLAGS
{{FLAGS}} (no --auto, no --only-business)

## MODEL/EFFORT
- Reviewer: {{ALIAS}} / {{EFFORT}} (user-given via flag) → {{MODEL_ID}}. Dispatched as uroboros:uroboros-reviewer-{{EFFORT}}, model {{ALIAS}}.
- Refuter: reviewer's choice ({{ALIAS}} / {{EFFORT}}), no --refuter flag.
- Verifier: reviewer's choice for implement ({{ALIAS}} / {{EFFORT}}), no --verifier flag.
- Implementer: {{ALIAS}} / {{EFFORT}} (user-given via flag) → {{MODEL_ID}}.

## SPEC-KIT
SPEC-KIT: 1.1.0 (contract baseline 1.1.0). Required skills present. Optional: speckit-git-feature present, speckit-converge present.
HOOKS: .specify/extensions.yml readable.

## SURFACES
The project is an HTTP JSON API only (no UI, no CLI, no jobs, no exports, no docs).
- Endpoints: GET /listings (search), POST /listings, GET /listings/:id, POST /listings/:id/orders, GET /orders.
- Published route table: src/gateway.ts PUBLIC_ROUTES — the server answers only these routes; any other is 404 before the app (tests bypass it: test/helpers.ts uses createApp directly).
- Roles: seller, buyer, admin (x-user-id header).
- New: POST /orders/:id/cancel, POST /orders/:id/fulfill, GET /orders/:id (named in the idea).

## READERS (existing features that read or act on an order's status)
- GET /orders (src/orders.ts listOrders) — lists orders by role; shows each order's status, whatever it is.
- POST /listings/:id/orders (placeOrder) — creates orders `open`; adds +1 rankScore to the listing.
- OrderStatus in src/domain.ts already holds `open`, `fulfilled` and `cancelled`; nothing sets the last two today.

## DECISION TREE
Settled (round 1): who cancels (D1, Q1), who fulfills (D2, Q2), who sees the detail (D3, Q3), references (D4, Q4)
Settled (round 2): which orders change (D5, Q5), the listing's rank on cancel (D6, Q6), error codes and bodies (D7, Q7)
Way back: none needed — cancelled and fulfilled are final states the idea asks for.
Open: none — frontier empty.

## DECISION LOG
- D1 Only the buyer who placed an order may cancel it; sellers and admins may not. Answer: "Solo el comprador" (Q1)
- D2 Only the seller who owns the order's listing may fulfill it; admins may not. Answer: "Solo el vendedor de la publicación" (Q2)
- D3 The order's buyer, the seller who owns its listing and admins may see an order's detail; anyone else is refused. Answer: "Comprador, vendedor y administradores" (Q3)
- D4 No references: designed on the current API. Answer: "No hay referencias" (Q4)
- D5 (rule) Only an open order may be cancelled or fulfilled; any other order, a repeated action included, is refused. Answer: "Solo pedidos abiertos" (Q5)
- D6 Cancelling does not take back the rank the order gave the listing. Answer: "El ranking se queda como está" (Q6)
- D7 Exact error codes and success bodies are left to the plan, in the API's existing error style. Answer: "Elige tú" (Q7)

## ASSUMPTION LOG
(empty)

## DEFERRED
(empty)

## SIZE
standard (orchestrator classification, confirmed by the user at the shared-understanding check: "Coincide") → round cap 3 per phase.

## SHARED-UNDERSTANDING CHECK
Answer: "Coincide". Confirmed non-goals: refunds, notifications, a reason for a cancel, a history of status changes, admins cancelling or fulfilling, any change to the orders list, to placing orders or to how rank is earned.

## SPECIFY PROMPT
Feature: Order lifecycle — buyers cancel open orders, sellers fulfill orders on their listings, and the parties of an order see its detail.

WHY: An order is placed and then nothing can happen to it: a buyer cannot take it back, a seller cannot close it once delivered, and nobody can look at one order on its own.

WHAT:
- `POST /orders/:id/cancel`: the buyer who placed the order cancels it. Nobody else may (not the seller, not admins).
- `POST /orders/:id/fulfill`: the seller who owns the order's listing marks it fulfilled. Nobody else may (not admins).
- `GET /orders/:id`: the order's buyer, the seller who owns its listing and admins see the order; anyone else is refused.
- Only an open order can be cancelled or fulfilled; any other order is refused, a repeated cancel or fulfill included.
- Cancelling does not take back the rank the order gave the listing.
- The three routes are part of the published API (the server's public route table).
- Errors follow the API's existing style: `{ "error": "<snake_case_code>" }` with a 4xx status; exact codes and success bodies are left to the plan.

Surfaces: the HTTP JSON API is the only surface. In scope: the three new routes. Unchanged: the orders list, placing orders, listings and search.

Readers of the order's status: the orders list shows whatever status an order has, unchanged; placing an order keeps creating it `open`.

Non-goals:
- Refunds, notifications, a reason for a cancel, a history of status changes.
- Admins cancelling or fulfilling orders.
- Any change to the orders list, to placing orders or to how ranking score is earned.

References: none.

## Literals
Carry these into the spec exactly as written; do not translate or reword them.
- `POST /orders/:id/cancel`
- `POST /orders/:id/fulfill`
- `GET /orders/:id`

## Open decisions
None. (Do not resolve any further ambiguity silently; mark it `[NEEDS CLARIFICATION]`.)

## DECLINED HOOKS
- after_specify: speckit.git.commit (optional) — declined
- before_clarify, after_clarify: speckit.git.commit (optional) — declined
- before_plan, after_plan: speckit.git.commit (optional) — declined
- before_tasks, after_tasks: speckit.git.commit (optional) — declined
- before_analyze, after_analyze: speckit.git.commit (optional) — declined

## SKIPPED HOOKS
- before_specify: speckit.git.feature — skipped, branch created in Phase 0.5

## PHASES
### specify
status: done — round 1 CLEAN with evidence (model check ok, contract ok). Inferences caught: 0. Refuted: 0. Questions: 0. Assumptions: 0.
artifacts: spec.md
### clarify
status: done — round 1 CLEAN with evidence (model check ok, contract ok). speckit-clarify result: no critical ambiguities; 0 questions; spec unchanged.
### plan
status: done — round 1 CLEAN with evidence (model check ok, contract ok); risks: none. artifacts: plan.md, quickstart.md (no research.md: nothing unknown; no data-model.md: no new entity or field)
### tasks
status: done — round 1 CLEAN with evidence (model check ok, contract ok). artifact: tasks.md (T001–T010)
### analyze
status: done — round 1 CLEAN with evidence (model check ok, contract ok).
speckit-analyze report (read-only): no findings.
Coverage: FR-001..FR-010 and SC-001..SC-003 each have >=1 task (100%). Unmapped tasks: none (T010 = gate/quickstart). Constitution: unfilled template, no principles → no alignment issues. Metrics: 10 FR + 3 SC, 10 tasks, coverage 100%, ambiguity 0, duplication 0, critical 0.
### implement
(not started)
