# Feature Specification: Pause and resume a listing

**Input**: "Quiero que los vendedores puedan pausar una publicación sin perder su ranking, y reanudarla después." `POST /listings/:id/pause` and `POST /listings/:id/resume`; a paused listing has status `paused`.

## User Scenarios & Testing

### User Story 1 — A seller pauses a listing (Priority: P1)

**Acceptance Scenarios**:

1. **Given** `l_lamp` is active, **When** its owner pauses it, **Then** the response is 200 with `status: "paused"` and the same `rankScore`.
2. **Given** `l_lamp` was paused, **When** anyone searches, **Then** `l_lamp` is not in the results.
3. **Given** `l_lamp` is paused, **When** anyone fetches it by id, **Then** it is returned with `status: "paused"`.
4. **Given** `l_lamp` is paused, **When** a buyer orders it, **Then** the order is refused with 409 `listing_paused`.

### User Story 2 — The seller resumes it (Priority: P1)

**Acceptance Scenarios**:

1. **Given** `l_lamp` is paused, **When** its owner resumes it, **Then** the response is 200 with `status: "active"` and the `rankScore` it had when paused.
2. **Given** `l_lamp` was resumed, **When** anyone searches, **Then** `l_lamp` is in the results again.

### User Story 3 — Who may do it, and repeated actions (Priority: P2)

**Acceptance Scenarios**:

1. **Given** `l_lamp` belongs to `u_seller_ana`, **When** `u_seller_leo` or a buyer pauses or resumes it, **Then** it is refused with 403 `not_listing_owner` (401 without a caller) and nothing changes.
2. **Given** any listing, **When** an admin pauses and then resumes it, **Then** both succeed.
3. **Given** `l_lamp` is paused, **When** its owner pauses it again, **Then** it succeeds and nothing changes; resuming an active listing likewise.

## Requirements

- **FR-001** Owners and admins can pause and resume a listing; anyone else is refused.
- **FR-002** A paused listing is excluded from `GET /listings` and still returned by `GET /listings/:id`.
- **FR-003** Orders on a paused listing are refused.
- **FR-004** Pause and resume never change `rankScore`.
- **FR-005** Repeated pause or resume succeeds without change.
- **FR-006** A signed-in user who pauses or resumes a listing id that does not exist is refused with 404 `listing_not_found`.
