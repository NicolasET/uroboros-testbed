# Feature Specification: Listing moderation rules

**Feature Branch**: `000-moderation`
**Status**: Implemented

## Clarifications

### Session 2026-09-01

- Q: Which statuses can a listing have? → A: A single status, `active`, for now. (D1)
- Q: Who may change a listing's status? → A: Only admins. (D2)
- Q: How does the API answer a refused request? → A: In the existing error style, a JSON body `{ "error": "<snake_case_code>" }` with a 4xx status. (D3)
- Q: Which exact error codes and success bodies? → A: The implementer's choice, in that style. (D5)
- Search lists only `active` listings. (assumed — A1)

## Requirements

- **FR-001**: A listing MUST have the status `active`.
- **FR-002**: Only an admin MAY change a listing's status.
- **FR-003**: Every refusal MUST answer `{ "error": "<snake_case_code>" }` with a 4xx status.
