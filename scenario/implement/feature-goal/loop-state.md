# Loop state — order-lifecycle

FEATURE: order-lifecycle
BRANCH: goal/order-lifecycle
BASE BRANCH: main @ {{BASE_SHA}}
UROBOROS: {{UROBOROS_VERSION}}
PRIVATE RECORD: {{PRIVATE_RECORD}}
ACTIVE FLAGS: {{FLAGS}} (no --auto, no --only-business)
LANGUAGE: Spanish
EARLIER FEATURES: none
SIZE: large — Reach: three actions that share the route table and one rule for which orders change (set by the run; confirmed at the shared-understanding check)

## MODEL CHOICES

- Reviewer: {{ALIAS}} / {{EFFORT}} (user-given via flag) → {{MODEL_ID}}.
- Refuter: reviewer's choice ({{ALIAS}} / {{EFFORT}}), no --refuter flag.
- Verifier: reviewer's choice ({{ALIAS}} / {{EFFORT}}), no --verifier flag.
- Implementer: {{ALIAS}} / {{EFFORT}} (user-given via flag) → {{MODEL_ID}}.

## IDEA ITEMS

- I1: buyers can cancel an open order
- I2: the seller of the listing can mark an order as delivered
- I3: the buyer, the seller and admins can see the detail of an order
- I4: the API gets `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` and `GET /orders/:id`

## SURFACES

The project is an HTTP JSON API only (no UI, no CLI, no jobs, no exports, no docs).
- Endpoints: GET /listings (search), POST /listings, GET /listings/:id, POST /listings/:id/orders, GET /orders — out of scope, unchanged.
- Published route table: src/gateway.ts PUBLIC_ROUTES — the server answers only these routes; any other is 404 before the app (tests bypass it: test/helpers.ts uses createApp directly). In scope.
- Roles: seller, buyer, admin (x-user-id header).
- New, in scope: POST /orders/:id/cancel, POST /orders/:id/fulfill, GET /orders/:id.

## READERS

- GET /orders (src/orders.ts listOrders) — lists orders by role; shows each order's status, whatever it is. Unchanged.
- POST /listings/:id/orders (placeOrder) — creates orders `open`; adds +1 rankScore to the listing. Unchanged.

## DECISION LOG

- D1 Only the buyer who placed an order may cancel it; sellers and admins may not.
- D2 Only the seller who owns the order's listing may fulfill it; admins may not.
- D3 The order's buyer, the seller who owns its listing and admins may see an order's detail; anyone else is refused.
- D4 No references: designed on the current API.
- D5 (rule) Only an open order may be cancelled or fulfilled; any other order, a repeated action included, is refused.
- D6 Cancelling does not take back the rank the order gave the listing.
- D7 Exact error codes and success bodies are left to the plan, in the API's existing error style.
- D8 Stop when: none.
- Shared-understanding check: matches. Out of scope: refunds, notifications, a reason for a cancel, a history of status changes, admins cancelling or fulfilling, any change to the orders list, to placing orders or to how rank is earned.

## ASSUMPTION LOG

(empty)

## Phase: goal

status: done — round 1 CLEAN with evidence (model check ok, contract ok). Inferences caught: 0. Refuted: 0. Questions: 0. Assumptions: 0.
GROWTH: 4 idea items, 14 acceptance criteria, 0 leave_out questions.

## Phase: plan

status: done — round 1 CLEAN with evidence (model check ok, contract ok); risks: none. artifact: plan.md (G1–G4).
GROWTH: 4 idea items, 14 acceptance criteria, 4 plan groups, 0 leave_out questions.

## Phase: implement

(not started)
