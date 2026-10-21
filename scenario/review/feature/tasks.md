# Tasks: Pause and resume a listing

## Phase 1: Model

- [X] T001 Add `ListingStatus` and `Listing.status` in `src/domain.ts` (FR-002)

## Phase 2: Behavior

- [X] T002 Implement `setPaused` in `src/listings.ts`: owner or admin only, idempotent, `rankScore` untouched (FR-001, FR-004, FR-005)
- [X] T003 Exclude paused listings from `searchListings` in `src/listings.ts` (FR-002)
- [X] T004 Refuse orders on a paused listing with 409 `listing_paused` in `src/orders.ts` (FR-003)
- [X] T005 Route `POST /listings/:id/pause` and `/resume` in `src/app.ts` and publish them in `src/gateway.ts` (FR-001)

## Phase 3: Tests

- [X] T006 Add `test/pause.test.ts` with one test per acceptance scenario (US1–US3)
