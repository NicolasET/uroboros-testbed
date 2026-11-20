# Goal: order-lifecycle

## Goal condition

Buyers cancel their open orders, sellers fulfill open orders on their listings, and the parties of an order read it, through three new routes of the API.
Check: `npm test` exits 0; and on the running server (`npm start`), `GET /orders/o_seed` as `u_buyer_sam` answers 200 with the order.

## Acceptance criteria

- AC-1: Given the open order `o_seed` placed by buyer `u_buyer_sam`, when Sam cancels it (`POST /orders/o_seed/cancel`), then the request succeeds, the order's status is `cancelled` and the answer is the order.
- AC-2: Given a listing with ranking score 12 that Sam orders (score 13), when Sam cancels that order, then the listing's ranking score is still 13.
- AC-3: Given the open order `o_seed`, when the listing's seller, another seller or an admin tries to cancel it, then the request is refused with an error and the order stays open.
- AC-4: Given an order that is fulfilled or already cancelled, when its buyer cancels it, then the request is refused with an error and the order is unchanged.
- AC-5: Given an unknown order id, or a caller with no or an unknown identity, when the cancel is requested, then it is refused with an error and no order changes.
- AC-6: Given the open order `o_seed` on `u_seller_ana`'s listing, when Ana fulfills it (`POST /orders/o_seed/fulfill`), then the request succeeds, the order's status is `fulfilled` and the answer is the order.
- AC-7: Given the open order `o_seed`, when another seller, its buyer or an admin tries to fulfill it, then the request is refused with an error and the order stays open.
- AC-8: Given an order that is cancelled or already fulfilled, when the listing's seller fulfills it, then the request is refused with an error and the order is unchanged.
- AC-9: Given an unknown order id, or a caller with no or an unknown identity, when the fulfill is requested, then it is refused with an error and no order changes.
- AC-10: Given the order `o_seed`, when its buyer, the seller who owns its listing or an admin requests it (`GET /orders/o_seed`), then the request succeeds and the answer is the order.
- AC-11: Given the order `o_seed`, when another seller or another buyer requests it, then the request is refused with an error.
- AC-12: Given an order whose status changed, when a party requests it, then the answer shows its current status.
- AC-13: Given an unknown order id, or a caller with no or an unknown identity, when the detail is requested, then it is refused with an error.
- AC-14: `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` and `GET /orders/:id` are published on the running server like the existing routes.

## Constraints

- Each of the three refuses a caller with no or an unknown identity, then an unknown order id, before any other check; who may act is checked before the order's state.
- Cancelling sets the order's status to `cancelled`, and fulfilling to `fulfilled`. Nothing else of the order or of its listing changes; the listing keeps the ranking score the order gave it.
- A successful cancel, fulfill or detail answers with the order as the orders list shows it.
- A refused request leaves every order unchanged. Errors follow the API's existing style: a JSON body `{ "error": "<snake_case_code>" }` with a 4xx status.
- The orders list (`GET /orders`) and placing an order stay as they are.

## Stop when

none

## Out of scope

- Refunds, notifications, a reason for a cancel, a history of status changes (shared-understanding check).
- Admins cancelling or fulfilling orders (D1, D2).
- Any change to the orders list, to placing orders or to how ranking score is earned (shared-understanding check).

## Surfaces

- `POST /orders/:id/cancel`, `POST /orders/:id/fulfill`, `GET /orders/:id` — in scope (new), the published route table included.
- `GET /orders`, `POST /listings/:id/orders`, listings and search — out of scope, unchanged.

## Readers

- The orders list (`GET /orders`) shows whatever status an order has, unchanged.
- Placing an order keeps creating it `open`.

## Literals

These are exact: never translate or reword them.

- `POST /orders/:id/cancel`
- `POST /orders/:id/fulfill`
- `GET /orders/:id`

## References

none
