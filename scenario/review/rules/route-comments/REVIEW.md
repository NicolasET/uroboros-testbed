# Review rules

## Handlers name their route

- **Trigger:** a change that adds or edits an exported function in `src/listings.ts` or `src/orders.ts`.
- **Check:** the function has a doc comment whose first words are the HTTP method and path it answers (for example `/** GET /listings/:id */`), so a reader finds the handler from the route and the route from the handler.
- **Origin:** a handler with no route comment was wired to the wrong path in `src/app.ts`, and nobody noticed for a week.
