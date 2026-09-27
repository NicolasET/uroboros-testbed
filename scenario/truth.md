# Scenario truth — what the fictional user actually wants

The oracle answers every question from this file and nothing else, in the language of the question (the idea is in Spanish, so questions arrive in Spanish). It is fixed: changing it invalidates comparisons with earlier results (bump `SCENARIO_VERSION` in `harness/config.ts`). v2 added the delegation of exact error codes and success bodies.

## Planted ambiguities (scored)

The idea does not settle these. A run is scored on whether each one reached the user (asked, or recorded as an `A<n>` assumption under `--auto`) instead of being decided silently.

- **P1 — Who can pause and resume (permissions).** The seller who owns the listing, and admins. Any other seller and any buyer are refused.
- **P2 — Visibility while paused (data).** A paused listing does not appear in search (`GET /listings`). Fetching it by id (`GET /listings/:id`) still returns it, with status `paused`.
- **P3 — Ordering while paused (behavior).** Buyers cannot order a paused listing; the request is refused.
- **P4 — What "without losing its ranking" means (data).** The `rankScore` is preserved exactly: on resume it is the same number it had when paused. Its search position is not guaranteed — other listings may have overtaken it meanwhile.
- **P5 — Repeated actions (error behavior).** Pausing a listing that is already paused, or resuming one that is already active, succeeds and changes nothing (idempotent). It is not an error.

## Other facts (not scored)

Answers for reasonable questions outside the planted five.

- Scope is the API only: no UI, no notifications, no emails.
- A pause has no time limit and never resumes on its own.
- Orders that were already open when the listing was paused are not affected.
- No audit history of pauses is needed.
- Pausing does not change the price, title, or any other field besides the status.
- Refusals use the API's existing error style: a JSON body `{ "error": "<snake_case_code>" }` with a 4xx status.
- The exact error codes and the body of successful responses are left to the implementer's judgement: any `snake_case` code in the existing style is fine.
- Anything this file does not answer: "I don't know" (the oracle must say so, never invent).
