# Scenario truth — what the fictional user actually wants

The oracle answers every question from this file and nothing else, in the language of the question (the idea is in Spanish, so questions arrive in Spanish). It is fixed: changing it invalidates comparisons with earlier results (bump `SCENARIO_VERSION` in `harness/config.ts`). v2 added the delegation of exact error codes and success bodies. v3 and v4 changed only the oracle's rules (`harness/oracle.ts`), v5 only the fixture's spec-kit (1.0.0 → 1.1.0), and v6 the fixture's server (a route table) and the hidden runtime tests, not this file. v7 added the standing decisions and the line on minor cases here, and one oracle rule. v8 changed how the oracle reads this file — it sees the facts alone (`userView` in `harness/oracle.ts`), without this paragraph, the scoring in the headings or the ids P1–P5 — and split the standing-decision answers into those given while the feature is worked on and those given when it is done: in v7 the oracle set S1 and S3 aside only about half the time.

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
- Minor cases and rare combinations — any question that lists cases v1 is unlikely to meet (such as two people pausing the same listing at the same moment, a pause arriving while an order is being placed, or which error wins when one request breaks two rules at once) and asks whether to leave them out of this feature or decide some: "I don't know", even when the cases are about errors. When such a list also holds a case this file settles, answer that case and say "I don't know" for the rest.
- Anything this file does not answer: "I don't know" (the oracle must say so, never invent).

## Standing decisions (not scored as ambiguities)

The project's `.uroboros/decisions.md` holds three standing decisions from an earlier feature (`scenario/standing-decisions.md`, copied into the default, auto and goal workspaces). The idea contradicts S1 and S3.

- **S1 — Only admins change a listing's status.** My idea contradicts it.
- **S2 — Exact error codes and success bodies are the implementer's choice, in the API's existing error style.** It still holds.
- **S3 — A listing has a single status, `active`.** My idea contradicts it.
- While the feature is being worked on, asked what to do about S1 or S3 (keep it, set it aside for this feature, or change it for the project): set it aside for this feature only, whatever the option is called (e.g. "exception here only", "ignore it here"). I do not change or retire a standing decision for the whole project before the work is done, even when an option already proposes the new wording.
- When the work is done, asked which of this feature's decisions to keep as standing decisions for the whole project: add all listed.
- When the work is done, asked what to do with the standing decisions this feature set aside: change S1 to "Only admins change a listing's status, except that the seller who owns a listing may pause and resume it", and retire S3. S2 stays as it is.
