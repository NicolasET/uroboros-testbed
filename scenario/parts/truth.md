# Parts scenario truth — what the fictional user wants

Read by the oracle only in the `parts` mode: the two ideas of the `medium` and `small` modes asked for at once, by a user who wants them built at the same time. It is fixed: changing it or `idea.md` here bumps `PARTS_EVAL_VERSION` in `harness/config.ts`.

## How I want it run

- Asked whether to treat the idea as one feature or to split it: split it, with the other part running at the same time in its own session.
- Asked which part this session carries: the maximum price filter. The startup message is the other part.
- Asked whether to start the parts when there are uncommitted changes, or anything else about starting them: start the parts.
- Asked whether to take over a run that an earlier session of mine left unfinished, or to stop: take it over.

## What I want from the price filter

- `GET /listings?maxPrice=<n>` returns only the listings whose price in cents is less than or equal to `<n>`: a listing that costs exactly `<n>` is included.
- It combines with the existing title filter `q`: a listing is returned only when it passes both.
- Without `maxPrice` the search answers exactly as it does today, and the order of the results does not change: best ranked first.
- A `maxPrice` that is not a positive whole number (text, a decimal, zero, a negative number) is refused with a 4xx error; no results are returned for it.
- The exact error code is left to the implementer's judgement, in the API's existing style: a JSON body `{ "error": "<snake_case_code>" }`.

## What I want from the startup message

- The line the server prints when it starts changes from `listings-api on http://localhost:<port>` to `API de publicaciones lista en http://localhost:<port>`, with the real port in place of `<port>`.
- The text is exact: the same words and capital letters, and no period at the end.
- Nothing else changes: no other message, no new option, no new log line.

## Other things I know

- The two things do not depend on each other.
- Scope is these two things: no other filter, no UI, no change to any other route.
- Tests: whatever the implementer judges enough; I ask for none in particular.
- Anything else: "I don't know" — never invent.
