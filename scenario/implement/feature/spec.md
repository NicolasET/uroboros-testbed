# Feature Specification: Order lifecycle — cancel, fulfill and order detail

**Feature Branch**: `001-order-lifecycle`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Quiero que los compradores puedan cancelar un pedido abierto, que el vendedor de la publicación pueda marcarlo como entregado, y que el comprador, el vendedor y los administradores puedan ver el detalle de un pedido. Agrégalo a la API como `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` y `GET /orders/:id`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A buyer cancels an open order (Priority: P1)

A buyer who placed an order changes their mind while the order is still open and cancels it. The listing keeps the ranking score the order gave it.

**Why this priority**: Buyers have no way back from an order today.

**Independent Test**: As buyer Sam, cancel the seeded open order `o_seed`; then confirm it is `cancelled` and that nobody else could cancel it.

**Acceptance Scenarios**:

1. **Given** the open order `o_seed` placed by buyer Sam, **When** Sam cancels it, **Then** the request succeeds, the order's status is `cancelled` and the answer is the order.
2. **Given** a listing with ranking score 12 that Sam orders (score 13), **When** Sam cancels that order, **Then** the listing's ranking score is still 13.
3. **Given** the open order `o_seed`, **When** the listing's seller, another seller or an admin tries to cancel it, **Then** the request is refused with an error and the order stays open.
4. **Given** an order that is fulfilled or already cancelled, **When** its buyer cancels it, **Then** the request is refused with an error and the order is unchanged.
5. **Given** an unknown order id, or a caller with no or an unknown identity, **When** the cancel is requested, **Then** it is refused with an error and no order changes.

---

### User Story 2 - A seller fulfills an open order on their listing (Priority: P1)

The seller who owns a listing marks an open order on it as fulfilled once it is delivered.

**Why this priority**: Sellers have no way to close the orders they deliver.

**Independent Test**: As seller Ana, fulfill `o_seed` (an order on her listing `l_chair`); then confirm it is `fulfilled` and that nobody else could fulfill it.

**Acceptance Scenarios**:

1. **Given** the open order `o_seed` on Ana's listing, **When** Ana fulfills it, **Then** the request succeeds, the order's status is `fulfilled` and the answer is the order.
2. **Given** the open order `o_seed`, **When** another seller, its buyer or an admin tries to fulfill it, **Then** the request is refused with an error and the order stays open.
3. **Given** an order that is cancelled or already fulfilled, **When** the listing's seller fulfills it, **Then** the request is refused with an error and the order is unchanged.
4. **Given** an unknown order id, or a caller with no or an unknown identity, **When** the fulfill is requested, **Then** it is refused with an error and no order changes.

---

### User Story 3 - The parties of an order see its detail (Priority: P2)

The buyer who placed an order, the seller who owns its listing and admins can fetch that one order, with its current status.

**Why this priority**: Today an order is only visible inside the orders list; the two actions above make its current status worth checking on its own.

**Independent Test**: Fetch `o_seed` as Sam, Ana and an admin (each succeeds), and as another seller (refused).

**Acceptance Scenarios**:

1. **Given** the order `o_seed`, **When** its buyer, the seller who owns its listing or an admin requests it, **Then** the request succeeds and the answer is the order.
2. **Given** the order `o_seed`, **When** another seller or another buyer requests it, **Then** the request is refused with an error.
3. **Given** an order whose status changed, **When** a party requests it, **Then** the answer shows its current status.
4. **Given** an unknown order id, or a caller with no or an unknown identity, **When** the detail is requested, **Then** it is refused with an error.

---

### Edge Cases

- Cancelling or fulfilling an order twice: the second request is refused, like any order that is not open.
- An admin may see every order but cancels and fulfills none.
- A seller who owns other listings, but not this order's listing, is "another seller".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The API MUST offer `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` and `GET /orders/:id`, published on the running server like the existing routes.
- **FR-002**: Each of the three MUST refuse a caller with no or an unknown identity, then an unknown order id, before any other check.
- **FR-003**: Only the buyer who placed an order MAY cancel it; any other caller MUST be refused.
- **FR-004**: Only the seller who owns an order's listing MAY fulfill it; any other caller MUST be refused.
- **FR-005**: Only an order's buyer, the seller who owns its listing and admins MAY see its detail; any other caller MUST be refused.
- **FR-006**: Only an `open` order MAY be cancelled or fulfilled; any other order MUST be refused, after the check of who may act on it.
- **FR-007**: Cancelling MUST set the order's status to `cancelled`, and fulfilling to `fulfilled`. Nothing else of the order or of its listing changes; the listing keeps the ranking score the order gave it.
- **FR-008**: A successful cancel, fulfill or detail MUST answer with the order as the orders list shows it.
- **FR-009**: A refused request MUST leave every order unchanged. Errors follow the API's existing style, a JSON body `{ "error": "<snake_case_code>" }` with a 4xx status; the exact codes are set in plan.md.
- **FR-010**: The orders list (`GET /orders`) and placing an order MUST stay as they are.

### Key Entities

- **Order**: a buyer's order on a listing, with its buyer, its listing and its status (`open`, `fulfilled` or `cancelled` — the values the project already defines).
- **Listing**: owned by one seller; its ranking score grows with every order.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of cancels and fulfills by a caller other than the one FR-003 or FR-004 names are refused, and leave the order unchanged.
- **SC-002**: 0 orders that are not open change status.
- **SC-003**: The buyer, the listing's seller and admins can each read one order with a single request.

## Assumptions

- The HTTP JSON API is the only surface of the project; no UI, CLI, background job or export exists to update.
- Users and their roles are the existing ones; no new role is added.

### Non-goals

- Refunds, notifications, a reason for a cancel, a history of status changes.
- Admins cancelling or fulfilling orders.
- Any change to the orders list, to placing orders or to how ranking score is earned.
