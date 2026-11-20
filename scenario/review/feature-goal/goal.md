# Goal: pause-listing

## Goal condition

A seller can pause a listing and resume it later through the listings API, and the listing keeps its rank.
Check: `npm test` exits 0; and on the running server (`npm start`), `POST /listings/l_lamp/pause` as `u_seller_ana` answers 200 with `status: "paused"`.

## Acceptance criteria

- AC-1: Given `l_lamp` is active, when its owner (`u_seller_ana`) pauses it (`POST /listings/l_lamp/pause`), then the response is 200 with `status: "paused"` and the same `rankScore`.
- AC-2: Given `l_lamp` was paused, when anyone searches (`GET /listings`), then `l_lamp` is not in the results.
- AC-3: Given `l_lamp` is paused, when anyone fetches it by id (`GET /listings/l_lamp`), then it is returned with `status: "paused"`.
- AC-4: Given `l_lamp` is paused, when a buyer (`u_buyer_sam`) orders it (`POST /listings/l_lamp/orders`), then the order is refused with 409 `listing_paused`.
- AC-5: Given `l_lamp` is paused, when its owner resumes it (`POST /listings/l_lamp/resume`), then the response is 200 with `status: "active"` and the `rankScore` it had when paused.
- AC-6: Given `l_lamp` was resumed, when anyone searches, then `l_lamp` is in the results again.
- AC-7: Given `l_lamp` belongs to `u_seller_ana`, when `u_seller_leo` or a buyer pauses or resumes it, then it is refused with 403 `not_listing_owner` (401 without a caller) and nothing changes.
- AC-8: Given any listing, when an admin (`u_admin_kim`) pauses and then resumes it, then both succeed.
- AC-9: Given `l_lamp` is paused, when its owner pauses it again, then it succeeds and nothing changes; resuming an active listing likewise.
- AC-10: Pause and resume never change the `rankScore` of a listing.

## Constraints

- Only the status of a listing changes on pause and resume: no other field.
- No other route, field or existing behavior of the API changes.
- A listing id that does not exist keeps answering 404 `listing_not_found`, as `GET /listings/:id` does today (D6).
- Refusals keep the API's existing error style: a JSON body `{ "error": "<snake_case_code>" }` with a 4xx status.

## Stop when

none

## Out of scope

- Any UI, notification or email (D7).
- A time limit on a pause, or a pause that ends on its own (D7).

## Surfaces

- `POST /listings/:id/pause`, `POST /listings/:id/resume` — in scope (new).
- `GET /listings`, `GET /listings/:id`, `POST /listings/:id/orders` — in scope (they read the new status).
- `GET /orders`, `POST /listings` — out of scope.

## Readers

- Search (`GET /listings`): leaves a paused listing out.
- Fetch by id (`GET /listings/:id`): still returns it, with `status: "paused"`.
- Orders (`POST /listings/:id/orders`): refused on a paused listing.

## Literals

These are exact: never translate or reword them.

- `paused`
- `POST /listings/:id/pause`
- `POST /listings/:id/resume`

## References

- The API starts with `npm start` (port 3000; `PORT=<n> npm start` for another port). Every start loads the same seed: sellers `u_seller_ana` (owns `l_lamp`, rankScore 12, and `l_chair`, rankScore 30) and `u_seller_leo` (owns `l_desk`, rankScore 21), buyer `u_buyer_sam`, admin `u_admin_kim`.
- The caller is the `x-user-id` request header.
