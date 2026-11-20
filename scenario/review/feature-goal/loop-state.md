# Loop state — pause-listing

FEATURE: pause-listing
UROBOROS: 1.0.0
ACTIVE FLAGS: default
LANGUAGE: Spanish
EARLIER FEATURES: none
SIZE: medium — Risk: a contract others consume (set by the run)

## IDEA ITEMS

- I1: sellers can pause a listing without it losing its rank
- I2: sellers can resume a paused listing later
- I3: the listings API gets `POST /listings/:id/pause` and `POST /listings/:id/resume`
- I4: a paused listing has status `paused`

## SURFACES

- `POST /listings/:id/pause`, `POST /listings/:id/resume`: in scope
- `GET /listings`, `GET /listings/:id`, `POST /listings/:id/orders`: in scope
- `GET /orders`, `POST /listings`: out of scope

## DECISION LOG

- D1 Who pauses and resumes: the owning seller and admins; anyone else is refused.
- D2 A paused listing is hidden from search; by id it is still returned, with status paused.
- D3 Buyers cannot order a paused listing.
- D4 The rankScore is kept exactly across pause and resume.
- D5 Pausing a paused listing, or resuming an active one, succeeds and changes nothing.
- D6 A listing id that does not exist keeps the answer the API gives today, 404 listing_not_found.
- D7 Scope is the API only; a pause has no time limit and never ends on its own.

## ASSUMPTION LOG

(none)

## GATE COMMANDS

- `npm test`
- `npm run typecheck`
- `npm run lint`

## Phase: goal

- Reviewer: CLEAN with evidence.

## Phase: implement

### Round 1

- Implementer: DONE — AC-1 to AC-10.
- Gate: green (`npm test`, `npm run typecheck`, `npm run lint`).

