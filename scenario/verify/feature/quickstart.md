# Quickstart: pause and resume a listing

## Prerequisites

- Node.js; dependencies already installed (`node_modules`).
- Start the API with `npm start` (port 3000; `PORT=<n> npm start` for another port). Every start loads the same seed: sellers `u_seller_ana` (owns `l_lamp`, rankScore 12, and `l_chair`, rankScore 30) and `u_seller_leo` (owns `l_desk`, rankScore 21), buyer `u_buyer_sam`, admin `u_admin_kim`.
- The caller is the `x-user-id` request header. Errors are `{ "error": "<code>" }`.

Run the scenarios in order against one running server, from a fresh start.

| # | Request | Expected |
|---|---|---|
| QS-1 | `GET /listings` | 200; ids `l_chair`, `l_desk`, `l_lamp`, in that order |
| QS-2 | `POST /listings/l_lamp/pause` as `u_seller_ana` | 200; the listing with `status: "paused"`, `rankScore: 12` |
| QS-3 | `GET /listings` | 200; ids `l_chair`, `l_desk` — `l_lamp` is not there |
| QS-4 | `GET /listings/l_lamp` | 200; `status: "paused"`, `rankScore: 12` |
| QS-5 | `POST /listings/l_lamp/orders` as `u_buyer_sam` | 409 `listing_paused` |
| QS-6 | `POST /listings/l_lamp/pause` as `u_seller_ana` | 200; still `status: "paused"`, nothing else changed |
| QS-7 | `POST /listings/l_lamp/resume` as `u_seller_leo` | 403 `not_listing_owner`; `l_lamp` stays paused |
| QS-8 | `POST /listings/l_lamp/resume` as `u_seller_ana` | 200; `status: "active"`, `rankScore: 12` |
| QS-9 | `GET /listings` | 200; ids `l_chair`, `l_desk`, `l_lamp` |
| QS-10 | `POST /listings/l_desk/pause`, then `POST /listings/l_desk/resume`, both as `u_admin_kim` | 200 `status: "paused"`, then 200 `status: "active"` |
