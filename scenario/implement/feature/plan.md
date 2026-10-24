# Implementation Plan: Order lifecycle — cancel, fulfill and order detail

**Branch**: `001-order-lifecycle` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-order-lifecycle/spec.md`

## Summary

Add `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` and `GET /orders/:id`. Each action gets its own handler module next to `src/orders.ts`, so the three user stories share no file: Foundational routes the three paths and publishes them, with handlers that already refuse an unknown caller and an unknown order and answer `501` for the rest; each story then replaces its handler's `501` with its rules and adds its own test file. `Order` and `OrderStatus` already exist in `src/domain.ts` with the three statuses; no data change.

## Technical Context

**Language/Version**: TypeScript 6 on Node.js 24 (ESM, run via `tsx`)

**Primary Dependencies**: none at runtime (Node `node:http`); dev: tsx, typescript, eslint, typescript-eslint

**Storage**: in-memory `Store` (`src/store.ts`), fresh on every server start and every test

**Testing**: `node:test` via `npm test` (`tsx --test test/*.test.ts`), HTTP-level tests that start the app with `startApi()` from `test/helpers.ts`, as `test/app.test.ts` does

**Target Platform**: Node.js HTTP server (`npm start`, port `PORT` or 3000)

**Project Type**: web-service (JSON HTTP API)

**Performance Goals**: none new; each action is one map lookup

**Constraints**: the existing error style `{ "error": "<snake_case_code>" }` with a 4xx status; no new dependencies

**Scale/Scope**: 3 new endpoints, 3 new handler modules, 3 new test files, 2 changed files (router, route table)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is the unfilled template (placeholders only); it defines no principles or gates. Gate: PASS. Post-design re-check: PASS — no new projects, dependencies or patterns.

## Project Structure

### Documentation (this feature)

```text
specs/001-order-lifecycle/
├── spec.md
├── plan.md
├── quickstart.md
└── tasks.md
```

No `research.md` (nothing unknown) and no `data-model.md` (no new entity or field).

### Source Code (repository root)

```text
src/
├── app.ts            # router: the three new routes (Foundational)
├── gateway.ts        # PUBLIC_ROUTES: the three new routes (Foundational)
├── order-cancel.ts   # new: cancelOrder (Foundational creates it, US1 completes it)
├── order-fulfill.ts  # new: fulfillOrder (Foundational creates it, US2 completes it)
├── order-detail.ts   # new: getOrder (Foundational creates it, US3 completes it)
├── orders.ts, domain.ts, store.ts, auth.ts, http.ts, listings.ts, ranking.ts, server.ts   # unchanged
test/
├── order-cancel.test.ts    # new (US1)
├── order-fulfill.test.ts   # new (US2)
├── order-detail.test.ts    # new (US3)
├── app.test.ts, helpers.ts # unchanged
```

**Structure Decision**: single existing project. One module per action, each with the handler signature of `src/orders.ts` — `(orderId: string, req: IncomingMessage, res: ServerResponse, store: Store): void` — and its own test file.

## Contract

Every action checks, in this order, and stops at the first refusal; a refusal changes nothing.

| Check | `POST /orders/:id/cancel` | `POST /orders/:id/fulfill` | `GET /orders/:id` |
|---|---|---|---|
| no or unknown `x-user-id` | `401 unauthenticated` | `401 unauthenticated` | `401 unauthenticated` |
| unknown order id | `404 order_not_found` | `404 order_not_found` | `404 order_not_found` |
| who may act | caller is the order's `buyerId`, else `403 not_order_buyer` | caller is the `sellerId` of the order's listing, else `403 not_order_seller` | caller is the buyer, the listing's seller or role `admin`, else `403 not_order_party` |
| order state | `status === 'open'`, else `409 order_not_open` | `status === 'open'`, else `409 order_not_open` | — |
| success | status `cancelled`; `200` with the order | status `fulfilled`; `200` with the order | `200` with the order |

The order is answered as `GET /orders` shows it: `{ id, listingId, buyerId, status, createdAt }`. Errors use `sendError` from `src/http.ts`, the caller comes from `currentUser` in `src/auth.ts`. Cancelling never touches the listing: the rank the order gave it stays (FR-007).

## Design

1. **Foundational.** Create the three modules. Each handler resolves the caller (`401`) and the order (`404`) as the contract says, then answers `501 { "error": "not_implemented" }`. Route the three paths in `src/app.ts` (`parts[0] === 'orders'`, the id in `parts[1]`, `cancel` or `fulfill` in `parts[2]`) and add `'GET /orders/:id'`, `'POST /orders/:id/cancel'` and `'POST /orders/:id/fulfill'` to `PUBLIC_ROUTES` in `src/gateway.ts` (FR-001). The gate stays green: no route is reachable yet beyond its `501`.
2. **US1** replaces the `501` of `cancelOrder` with the cancel column of the contract. **US2** does the same in `fulfillOrder`, **US3** in `getOrder`. Each story touches only its module and its test file.
3. **Tests.** Each story's test file starts the app with `startApi()` per test, like `test/app.test.ts`, and has one test per acceptance scenario of its story. The seeded order `o_seed` (buyer `u_buyer_sam`, listing `l_chair` of `u_seller_ana`) is the order under test; a test that needs another status sets it on `api.store`.

## Complexity Tracking

No violations.
