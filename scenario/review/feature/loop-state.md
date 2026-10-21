# Loop state — 001-pause-listing

## ACTIVE FLAGS

default

## DECISION LOG

- D1 Who pauses and resumes: the owning seller and admins; anyone else is refused.
- D2 A paused listing is hidden from search; by id it is still returned, with status paused.
- D3 Buyers cannot order a paused listing.
- D4 The rankScore is kept exactly across pause and resume.
- D5 Pausing a paused listing, or resuming an active one, succeeds and changes nothing.

## ASSUMPTION LOG

(none)

## GATE COMMANDS

- `npm test`
- `npm run typecheck`
- `npm run lint`

## Phase: implement

### Round 1

- Implementer: DONE — tasks T001–T006.
- Gate: green (`npm test`, `npm run typecheck`, `npm run lint`).
