# Plan: order-lifecycle

## Approach

Each action gets its own handler module next to `src/orders.ts`, so the three actions share no file once their routes exist.

- `src/order-cancel.ts`, `src/order-fulfill.ts`, `src/order-detail.ts` (new) export `cancelOrder`, `fulfillOrder` and `getOrder` with the signature `(orderId: string, req: IncomingMessage, res: ServerResponse, store: Store): void`. They build on what `src/orders.ts` already does: the caller from `currentUser` in `src/auth.ts`, errors through `sendError` and answers through `sendJson` from `src/http.ts`. Pattern to follow: `listOrders` and `placeOrder` in `src/orders.ts`.
- `src/app.ts` (changed) routes `GET /orders/:id`, `POST /orders/:id/cancel` and `POST /orders/:id/fulfill` to them, keeping `GET /orders` as it is. Pattern to follow: the `listings` branch of the same router.
- `src/gateway.ts` (changed) publishes the three routes in `PUBLIC_ROUTES`.
- Tests: one file per action, started with `startApi()` from `test/helpers.ts` per test. Pattern to follow: `test/app.test.ts`.

## Data

Nothing stored is added or reshaped: `OrderStatus` in `src/domain.ts` already holds `open`, `fulfilled` and `cancelled` (AC-1, AC-6); nothing sets the last two today.

## Decisions

- The contract below — the exact statuses and error codes — is chosen by the run inside what D7 left to the plan, in the API's existing error style.
- One module per action instead of three functions in `src/orders.ts`: chosen by the run; no user-visible difference.
- Every action checks in this order and stops at the first refusal; a refusal changes nothing:

| Check | `POST /orders/:id/cancel` | `POST /orders/:id/fulfill` | `GET /orders/:id` |
|---|---|---|---|
| no or unknown `x-user-id` | `401 unauthenticated` | `401 unauthenticated` | `401 unauthenticated` |
| unknown order id | `404 order_not_found` | `404 order_not_found` | `404 order_not_found` |
| who may act | caller is the order's `buyerId`, else `403 not_order_buyer` | caller is the `sellerId` of the order's listing, else `403 not_order_seller` | caller is the buyer, the listing's seller or role `admin`, else `403 not_order_party` |
| order state | `status === 'open'`, else `409 order_not_open` | `status === 'open'`, else `409 order_not_open` | — |
| success | status `cancelled`; `200` with the order | status `fulfilled`; `200` with the order | `200` with the order |

- The order is answered as `GET /orders` shows it: `{ id, listingId, buyerId, status, createdAt }`.

## Risks

- A route that works in the tests and is missing on the running server: the tests start the app without the route table. `G1` publishes the three routes, and *How to run it* checks them on `npm start`.
- No step here is risky to repeat or cannot be undone: the store is in memory and fresh on every start.

## Work order

- G1 — The three routes exist, published, each reaching its own handler module, which already refuses an unknown caller (`401`) and an unknown order (`404`) and otherwise answers `501 { "error": "not_implemented" }`. Covers AC-14. Check: on `npm start`, each route answers something other than `404 route_not_found`; the gate is green. expects: `src/order-cancel.ts`, `src/order-fulfill.ts`, `src/order-detail.ts`, `src/app.ts`, `src/gateway.ts`.
- G2 — A buyer cancels an open order. Covers AC-1, AC-2, AC-3, AC-4, AC-5. after: G1. Check: `test/order-cancel.test.ts`, one test per criterion, asserting the cancel column of the contract. expects: `src/order-cancel.ts`, `test/order-cancel.test.ts`.
- G3 — A seller fulfills an open order on their listing. Covers AC-6, AC-7, AC-8, AC-9. after: G1. Check: `test/order-fulfill.test.ts`, one test per criterion, asserting the fulfill column of the contract. expects: `src/order-fulfill.ts`, `test/order-fulfill.test.ts`.
- G4 — The parties of an order see its detail. Covers AC-10, AC-11, AC-12, AC-13. after: G1. Check: `test/order-detail.test.ts`, one test per criterion, asserting the detail column of the contract. expects: `src/order-detail.ts`, `test/order-detail.test.ts`.

G2, G3 and G4 need only G1 and share no file with each other.

## How to run it

Gate: `npm test`, `npm run lint`, `npm run typecheck`. Server: `npm start` (port 3000, or `PORT`), which serves the published routes over the seed — users `u_seller_ana`, `u_seller_leo`, `u_buyer_sam`, `u_admin_kim`; listings `l_lamp` (Ana, score 12), `l_chair` (Ana, 30), `l_desk` (Leo, 21); order `o_seed` (Sam on `l_chair`, `open`). Each line starts from a fresh server.

- `curl -s -X POST localhost:3000/orders/o_seed/cancel -H "x-user-id: u_seller_ana"` → 403 `not_order_buyer`; as `u_buyer_sam` → 200, `status: "cancelled"`; again → 409 `order_not_open`.
- `curl -s -X POST localhost:3000/listings/l_lamp/orders -H "x-user-id: u_buyer_sam"` → 201 with the new order's id; cancel it as Sam → 200; `curl -s localhost:3000/listings/l_lamp` → `rankScore: 13`.
- `curl -s -X POST localhost:3000/orders/o_seed/fulfill -H "x-user-id: u_seller_leo"` → 403 `not_order_seller`; as `u_seller_ana` → 200, `status: "fulfilled"`; then a cancel as Sam → 409 `order_not_open`.
- `curl -s localhost:3000/orders/o_seed -H "x-user-id: u_buyer_sam"` → 200 with the order, the same as `u_seller_ana` and as `u_admin_kim`; as `u_seller_leo` → 403 `not_order_party`.
- `curl -s localhost:3000/orders/o_nope -H "x-user-id: u_admin_kim"` → 404 `order_not_found`, the same for cancel and fulfill; any of the three on `o_seed` without `x-user-id` → 401 `unauthenticated`.
