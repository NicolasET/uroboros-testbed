# Implement eval truth — what the fictional user knows about the order feature

The oracle answers every question of the implement eval (`implement` mode) from this file and nothing else, as `scenario/truth.md` does for the pipeline modes; it sees the facts alone (`userView` in `harness/oracle.ts`). The feature reached implement with every decision below already recorded, so a run should need none of them; they are here so that a question the run still asks gets the same answer every time. Changing this file bumps `IMPLEMENT_EVAL_VERSION` in `harness/config.ts`.

## What I want

- **Who cancels.** Only the buyer who placed the order. Sellers and admins cannot cancel it.
- **Who fulfills.** Only the seller who owns the order's listing. Admins cannot fulfill it.
- **Who sees an order.** The buyer who placed it, the seller who owns its listing, and admins. Anyone else is refused.
- **Which orders change.** Only an open order can be cancelled or fulfilled. Cancelling or fulfilling an order that is not open is refused, also when it repeats the same action.
- **The listing's rank.** Cancelling does not take back the rank the order gave the listing.

## Other facts

- Scope is the API only: no UI, no notifications, no emails, no refunds, no reason for a cancel, no history of status changes.
- The orders list and placing an order stay as they are.
- Refusals use the API's existing error style: a JSON body `{ "error": "<snake_case_code>" }` with a 4xx status. The exact codes and success bodies are the implementer's choice; the ones already written in the plan are fine.
- Minor cases and rare combinations — any question that lists cases v1 is unlikely to meet and asks whether to leave them out of this feature or decide some: "I don't know". When such a list also holds a case this file settles, answer that case and say "I don't know" for the rest.
- Asked whether to take over the earlier session's run of this feature: take it over.
- When the work is done, asked which of this feature's decisions to keep as standing decisions for the whole project: add none.
- Anything this file does not answer: "I don't know" (the oracle must say so, never invent).
