# Quickstart: validate the order lifecycle

Prerequisites: `npm install` done. Gate: `npm test`, `npm run lint`, `npm run typecheck`.

Run the server (published routes, seeded data): `npm start` (port 3000, or `PORT`). Each scenario starts from a fresh server.
Seed: users `u_seller_ana`, `u_seller_leo`, `u_buyer_sam`, `u_admin_kim`; listings `l_lamp` (Ana, score 12), `l_chair` (Ana, 30), `l_desk` (Leo, 21); order `o_seed` (Sam on `l_chair`, `open`).

## QS-1 A buyer cancels an open order
1. `curl -s -X POST localhost:3000/orders/o_seed/cancel -H "x-user-id: u_seller_ana"` → 403 `not_order_buyer`.
2. `curl -s -X POST localhost:3000/orders/o_seed/cancel -H "x-user-id: u_buyer_sam"` → 200, `status: "cancelled"`.
3. Repeat step 2 → 409 `order_not_open`.
4. `curl -s -X POST localhost:3000/listings/l_lamp/orders -H "x-user-id: u_buyer_sam"` → 201 with the new order's id; cancel it as Sam → 200; `curl -s localhost:3000/listings/l_lamp` → `rankScore: 13`.

## QS-2 A seller fulfills an open order on their listing
1. `curl -s -X POST localhost:3000/orders/o_seed/fulfill -H "x-user-id: u_seller_leo"` → 403 `not_order_seller`; the same as `u_admin_kim` → 403 `not_order_seller`.
2. `curl -s -X POST localhost:3000/orders/o_seed/fulfill -H "x-user-id: u_seller_ana"` → 200, `status: "fulfilled"`.
3. Cancel it as Sam → 409 `order_not_open`.

## QS-3 The parties see the order
1. `curl -s localhost:3000/orders/o_seed -H "x-user-id: u_buyer_sam"` → 200 with the order; the same as `u_seller_ana` and as `u_admin_kim`.
2. As `u_seller_leo` → 403 `not_order_party`.

## QS-4 Unknown order, unknown caller
- `curl -s localhost:3000/orders/o_nope -H "x-user-id: u_admin_kim"` → 404 `order_not_found`; the same for cancel and fulfill.
- Any of the three on `o_seed` without `x-user-id` → 401 `unauthenticated`.
