# Standing decisions

- S1 Only admins change a listing's status. (from 000-moderation, D2, 2026-09-01)
- S2 Exact error codes and success bodies are the implementer's choice, in the API's existing error style: a JSON body { "error": "<snake_case_code>" } with a 4xx status. (from 000-moderation, D5, 2026-09-01)
- S3 A listing has a single status, `active`. (from 000-moderation, D1, 2026-09-01)
