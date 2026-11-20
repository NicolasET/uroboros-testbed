# Medium scenario truth — what the fictional user wants

Read by the oracle only in the `medium` mode, the way `truth.md` is read in the others. It is fixed: changing it, `idea.md` or `max-price.test.ts` here bumps `MEDIUM_EVAL_VERSION` in `harness/config.ts`.

## What I want

- `GET /listings?maxPrice=<n>` returns only the listings whose price in cents is less than or equal to `<n>`: a listing that costs exactly `<n>` is included.
- It combines with the existing title filter `q`: a listing is returned only when it passes both.
- Without `maxPrice` the search answers exactly as it does today.
- The order of the results does not change: best ranked first, as today.
- A `maxPrice` that is not a positive whole number (text, a decimal, zero, a negative number) is refused with a 4xx error; no results are returned for it.

## Other things I know

- The exact error code is left to the implementer's judgement, in the API's existing style: a JSON body `{ "error": "<snake_case_code>" }`.
- Scope is this one filter on the API: no minimum price, no other new filter, no UI, no change to any other route.
- Anything else: "I don't know" — never invent.
