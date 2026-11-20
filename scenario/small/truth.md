# Small scenario truth — what the fictional user wants

Read by the oracle only in the `small` mode, the way `truth.md` is read in the others. It is fixed: changing it, `idea.md` or `startup.test.ts` here bumps `SMALL_EVAL_VERSION` in `harness/config.ts`.

## What I want

- The line the server prints when it starts changes from `listings-api on http://localhost:<port>` to `API de publicaciones lista en http://localhost:<port>`, with the real port in place of `<port>`.
- Nothing else changes: no other message, no new option, no new log line, no change to the API.

## Other things I know

- The text is exact: the same words and capital letters, and no period at the end.
- Tests for it: whatever the implementer judges enough; I ask for none in particular.
- Anything else: "I don't know" — never invent.
