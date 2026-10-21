# Loop state — 001-pause-listing

## ACTIVE FLAGS

default

## DECISION LOG

- D1 Who pauses and resumes: the owning seller and admins; anyone else is refused.
- D2 A paused listing is hidden from search; by id it is still returned, with status paused.
- D3 Buyers cannot order a paused listing.
- D4 The rankScore is kept exactly across pause and resume.
- D5 Pausing a paused listing, or resuming an active one, succeeds and changes nothing.
- D6 Pausing or resuming a listing id that does not exist is refused with 404 listing_not_found.

## ASSUMPTION LOG

(none)

## GATE COMMANDS

- `npm test`
- `npm run typecheck`
- `npm run lint`

## Phase: implement

- Implementer: DONE. Gate: green. Reviewer: CLEAN. CONVERGE: converged.
