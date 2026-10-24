---

description: "Task list for the order lifecycle feature"
---

# Tasks: Order lifecycle — cancel, fulfill and order detail

**Input**: Design documents from `/specs/001-order-lifecycle/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Included. The spec's acceptance scenarios are written to be checked by tests, and the project's gate runs every test file (`npm test`).

**Organization**: Tasks are grouped by user story. Each story has its own handler module and its own test file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Phase 1: Setup

No setup: the project, its dependencies and its gate (`npm test`, `npm run lint`, `npm run typecheck`) already exist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the three routes, published, each reaching its own handler module, so that no user story needs a file another one touches.

- [ ] T001 Create src/order-cancel.ts, src/order-fulfill.ts and src/order-detail.ts exporting `cancelOrder`, `fulfillOrder` and `getOrder` with the signature `(orderId: string, req: IncomingMessage, res: ServerResponse, store: Store): void`; each answers `401 unauthenticated` without a known caller, `404 order_not_found` for an unknown order id, and otherwise `501 not_implemented` (FR-002; plan.md Contract)
- [ ] T002 Route `GET /orders/:id`, `POST /orders/:id/cancel` and `POST /orders/:id/fulfill` to the T001 handlers in src/app.ts, keeping `GET /orders` as it is
- [ ] T003 [P] Add `'GET /orders/:id'`, `'POST /orders/:id/cancel'` and `'POST /orders/:id/fulfill'` to `PUBLIC_ROUTES` in src/gateway.ts (FR-001)

**Checkpoint**: the three routes answer on the running server (`501` past the shared checks) and the gate is green.

---

## Phase 3: User Story 1 - A buyer cancels an open order (Priority: P1) 🎯 MVP

**Goal**: The buyer who placed an open order cancels it; the listing keeps its rank.

**Independent Test**: As `u_buyer_sam`, cancel `o_seed`; only its buyer can, and only while it is open.

### Tests for User Story 1

- [ ] T004 [US1] Create test/order-cancel.test.ts with one test per acceptance scenario of User Story 1 (US1-AC1 to AC5), asserting the statuses and error codes of the cancel column of the Contract

### Implementation for User Story 1

- [ ] T005 [US1] In src/order-cancel.ts, replace the `501` of `cancelOrder`: `403 not_order_buyer` unless the caller is the order's buyer, `409 order_not_open` unless the order is `open`, else set its status to `cancelled` and answer `200` with the order; the listing is not touched (FR-003, FR-006, FR-007, FR-008)

**Checkpoint**: US1 works on its own.

---

## Phase 4: User Story 2 - A seller fulfills an open order on their listing (Priority: P1)

**Goal**: The seller who owns the order's listing marks an open order fulfilled.

**Independent Test**: As `u_seller_ana`, fulfill `o_seed`; only the listing's seller can, and only while it is open.

### Tests for User Story 2

- [ ] T006 [US2] Create test/order-fulfill.test.ts with one test per acceptance scenario of User Story 2 (US2-AC1 to AC4), asserting the statuses and error codes of the fulfill column of the Contract

### Implementation for User Story 2

- [ ] T007 [US2] In src/order-fulfill.ts, replace the `501` of `fulfillOrder`: `403 not_order_seller` unless the caller is the seller who owns the order's listing, `409 order_not_open` unless the order is `open`, else set its status to `fulfilled` and answer `200` with the order (FR-004, FR-006, FR-007, FR-008)

**Checkpoint**: US2 works on its own.

---

## Phase 5: User Story 3 - The parties of an order see its detail (Priority: P2)

**Goal**: The order's buyer, the listing's seller and admins read one order with its current status.

**Independent Test**: Fetch `o_seed` as `u_buyer_sam`, `u_seller_ana` and `u_admin_kim` (each succeeds) and as `u_seller_leo` (refused).

### Tests for User Story 3

- [ ] T008 [US3] Create test/order-detail.test.ts with one test per acceptance scenario of User Story 3 (US3-AC1 to AC4), asserting the statuses and error codes of the detail column of the Contract

### Implementation for User Story 3

- [ ] T009 [US3] In src/order-detail.ts, replace the `501` of `getOrder`: `403 not_order_party` unless the caller is the order's buyer, the seller who owns its listing or an admin, else answer `200` with the order (FR-005, FR-008)

**Checkpoint**: every user story works on its own.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T010 Run the gate (`npm test`, `npm run lint`, `npm run typecheck`) and the quickstart.md scenarios against `npm start`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: nothing to do.
- **Foundational (Phase 2)**: T001 before T002; T003 independent. Blocks every user story.
- **User Stories (Phases 3–5)**: each depends only on Foundational. They do not depend on each other and share no file — US1 touches only src/order-cancel.ts and test/order-cancel.test.ts, US2 only src/order-fulfill.ts and test/order-fulfill.test.ts, US3 only src/order-detail.ts and test/order-detail.test.ts — so they can proceed in parallel.
- **Polish (Phase 6)**: after every user story.

### Within Each User Story

- The test task first (T004, T006, T008); its tests fail before the implementation task (T005, T007, T009).

## Parallel Example

```text
After Phase 2, at the same time:
US1: T004, T005 (src/order-cancel.ts, test/order-cancel.test.ts)
US2: T006, T007 (src/order-fulfill.ts, test/order-fulfill.test.ts)
US3: T008, T009 (src/order-detail.ts, test/order-detail.test.ts)
```

## Implementation Strategy

MVP = Phase 2 + US1. Then US2 and US3 — in parallel when staffed — then Polish.
