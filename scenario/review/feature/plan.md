# Implementation Plan: Pause and resume a listing

**Spec**: [spec.md](./spec.md)

## Summary

Add `POST /listings/:id/pause` and `POST /listings/:id/resume`. A listing gains a `status` (`active` | `paused`); search skips paused listings, orders on them are refused, and `rankScore` is never touched by either action.

## Technical Context

- Node.js + TypeScript, the existing in-memory `Store` and plain `node:http` handlers; no new dependency.
- Tests: `node:test` through `tsx --test`, with the existing `test/helpers.ts`.
- Gate: `npm test`, `npm run typecheck`, `npm run lint`.

## Design

- `src/domain.ts`: `ListingStatus = 'active' | 'paused'`; `Listing.status`.
- `src/listings.ts`: `setPaused(id, paused, …)` — 401 without a caller, 404 for an unknown listing, 403 `not_listing_owner` unless the caller owns the listing or is an admin; sets the status and answers the listing (FR-001, FR-004, FR-005). `searchListings` keeps only active listings (FR-002).
- `src/orders.ts`: `placeOrder` answers 409 `listing_paused` for a paused listing (FR-003).
- `src/app.ts`: routes `POST /listings/:id/pause` and `/resume` to `setPaused`.
- `src/gateway.ts`: publishes both routes in `PUBLIC_ROUTES`.
- `test/pause.test.ts`: one test per acceptance scenario.

No other route, field or behavior changes.
