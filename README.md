# uroboros-testbed

A fixed, repeatable end-to-end test for the [uroboros](https://github.com/NicolasET/uroboros) Claude Code plugin. The same scenario runs after every uroboros minor or major release, so results can be compared version to version.

## What one run measures

For each mode — the default pipeline, `--auto`, `--goal`, `/uroboros:compat`, and the verifier and reviewer evals (`verify`, `review`):

| Measure | How |
|---|---|
| **End to end** | Deterministic checks: the session ended cleanly, the artifacts exist (`spec.md`, `plan.md`, `tasks.md`, `loop-state.md` or `goal.md`), every task is checked, the fixture's gate (test, typecheck, lint) is green, the goal marker closed as `complete`, the compat verdict is `covered`. |
| **Ambiguities detected** | The scenario plants 5 product decisions the idea does not settle ([`scenario/truth.md`](./scenario/truth.md)). A pinned judge model reads the questions uroboros asked, `loop-state.md` and the artifacts, and classifies each one as asked, recorded as an assumption, decided silently, or not addressed. |
| **Correct code** | 11 hidden acceptance tests ([`scenario/hidden-tests/`](./scenario/hidden-tests/)), never shown to uroboros, are copied in after the run and executed against the app in process, like the fixture's own tests. |
| **Works when run** | 3 hidden runtime tests start the real server (`src/server.ts`, what `npm start` runs) and pause, search and resume through it. The fixture's server answers only a published route table (`src/gateway.ts`) that the in-process tests bypass, so a feature can pass every in-process test and still be unreachable on the running server. |
| **Verifier** | From uroboros 0.16.0, each `VERIFIER-REPORT` the session received, read from the transcript: pass / fail / not-run per round, and whether a failure it reported was fixed by a later round. |
| **Cost and time** | Cost (list-price estimate), tokens, duration and number of questions, from the Agent SDK. Oracle and judge calls are counted apart. |

## How it works

- **Fixture** ([`fixture/`](./fixture/)): a minimal Node/TypeScript listings API with in-memory data, served behind a route table, and spec-kit **1.1.0** installed from its release tag (Claude integration, `ps` scripts, git extension) — the uroboros compatibility contract's baseline. It deliberately settles none of the planted decisions.
- **Scenario** ([`scenario/`](./scenario/)): the idea uroboros receives (in Spanish, the maintainer's language), the truth the fictional user holds, and the hidden tests.
- **Oracle**: uroboros phrases its questions differently every run, so a pinned small model (`claude-haiku-4-5-20251001`) answers each `AskUserQuestion` from `truth.md` alone, and says "No sé" to anything the truth does not settle. Every exchange is logged.
- **Roles**: the orchestrator, reviewer and implementer (and the refuter and verifier, which follow the reviewer's choice) all run on the latest Opus (`opus` alias) at **that model's own default effort**, resolved at the start of each run (the Agent SDK would otherwise default to `high`). The exact model and effort are recorded, so a model change is never mistaken for a plugin change.
- **Isolation**: sessions load project settings only (`settingSources: ['project']`), so the workspace's spec-kit skills are available and none of this machine's user settings, hooks, `CLAUDE.md` or MCP servers load. Each mode gets a fresh copy of the fixture as its own git repository, created outside the user's home — `C:\uro-testbed-work` on Windows, the OS temp directory elsewhere, or `UROBOROS_TESTBED_WORKDIR` — because Claude Code reads project instructions from every directory above the workspace (a home's `~/.claude/CLAUDE.md` would load). The harness refuses a root that has a `CLAUDE.md`, `AGENTS.md` or `.claude` above it.

## The verifier eval (`verify` mode)

The pipeline modes show whether a run builds the right thing; they cannot show whether uroboros's verifier (0.16.0+) would catch a defect the tests miss, because the implementer may simply not make one. The `verify` mode measures the verifier alone, like a reviewer run on known-buggy and known-clean changes:

- **Cases** ([`scenario/verify/cases.json`](./scenario/verify/cases.json)): the reference implementation with one planted defect each — `route` (pause and resume not in the server's route table: 404), `cache` (search cached by the server and not invalidated by a pause), `status` (the server's public view drops the `paused` status) — and `clean`, the reference as is. Every case passes the 11 hidden tests in process with a green gate; only the running server shows the defect.
- **Inputs**: a fixed `spec.md`, `quickstart.md` and `loop-state.md` ([`scenario/verify/feature/`](./scenario/verify/feature/)). One session per run dispatches the plugin's own `uroboros-verifier-<effort>` agent on the role model, with the prompt the orchestrator sends.
- **Scored**, over 3 runs per case: **detection** — a `fail` on a scenario the defect breaks; **false failures** — any `fail` on the clean copy, or on a scenario the defect does not break; `not-run` results; and whether the repository was left untouched.
- Versioned apart (`VERIFY_EVAL_VERSION`), since it changes nothing the other modes measure. A uroboros version without a verifier records the mode as not applicable.

## The reviewer eval (`review` mode)

The same idea for uroboros's implement reviewer: whether its report names a defect the gate does not catch, and what it reports on a clean change. It is the negative control for the review: a reviewer that returns `CLEAN` on every case scores zero.

- **Cases** ([`scenario/review/cases.json`](./scenario/review/cases.json)): the reference implementation plus one test per acceptance scenario ([`scenario/review/implementation/`](./scenario/review/implementation/)), with one planted defect each — `untracked` (the owner check moved to a new, untracked file whose operator precedence lets any seller pause an active listing), `skip` (search ignores the title query and the existing test is marked `.skip`), `suppress` (admins no longer see every order, hidden by `@ts-expect-error`), `weakened` (orders no longer raise the rank, and the existing assertion is loosened), `extra` (an endpoint nobody asked for) — and `clean`. Every case keeps the gate green; the clean copy passes the 11 hidden tests.
- **Inputs**: a fixed `spec.md`, `plan.md`, `tasks.md` and `loop-state.md` after implement's first round ([`scenario/review/feature/`](./scenario/review/feature/)), committed with the fixture; the change is left uncommitted, as a run leaves it. One session per run dispatches the plugin's own `uroboros-reviewer-<effort>` agent with the implement step-B prompt **of the uroboros version measured** (`stepBPrompt` in `harness/review-eval.ts`): before 0.16.2 the changed-file list is `git diff --name-only`; from 0.16.2 it adds the untracked files; from 0.17.0 the harness takes the plugin's working-tree snapshots before and after the change, writes the run diff to `.git/uroboros/run.diff`, passes it as `RUN_DIFF`, and records both trees and a green gate baseline in the state file, as the orchestrator does; from 0.18.0 the state file also carries the intake's `SURFACES` (all in scope) and an empty `### Shared code touched`. The prompt carries the plugin's model guide for the role model, as the orchestrator would. A version whose step B the builder does not reproduce yet stops the mode instead of guessing; extending it never changes the prompt of an earlier version.
- **Scored**, over 3 runs per case: **detection** — the pinned judge finds a finding or risk that names the planted defect (a `CLEAN` report never counts, even if it mentions the defect in passing); on the clean copy, how many runs returned `CLEAN` and how many findings and risks the others raised; and whether the working tree was left untouched. It scores the reviewer's report as it arrives, before the refuter (only a full pipeline runs the refuter).
- Versioned apart (`REVIEW_EVAL_VERSION`). Versions before 0.16.0 record the mode as not applicable.

## Run it

Requirements: Node.js 24+, Git, and Claude Code signed in (the Agent SDK uses that login; no API key needed).

```
npm install
npm test                                              # the harness's own checks (no model calls)
npm run testbed -- --uroboros ../uroboros             # a local checkout, e.g. before a release
npm run testbed -- --uroboros v0.13.0                 # a published tag
npm run testbed -- --uroboros ../uroboros --modes compat,goal
npm run testbed -- --uroboros ../uroboros --modes verify  # the verifier eval alone, ~20 min
npm run testbed -- --uroboros ../uroboros --modes review  # the reviewer eval alone
```

A full run takes hours and has no cost ceiling: the cost is recorded, not capped.

## Results

- `results/<version>/` — committed: `metrics.json`, `oracle-log.jsonl` and `summary.md`, which compares each mode against the most recent earlier version that measured that mode the same way (same scenario version and, for the evals, the same eval version) and ends with what the run does not prove. A version that is not exactly its release tag is labeled `<version>+<commit>`.
- `runs/` — local only: each mode's full session transcript. The workspaces themselves live outside this repository (see Isolation), so uroboros can never reach `scenario/`; the run prints their paths.
