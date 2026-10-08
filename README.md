# uroboros-testbed

A fixed, repeatable end-to-end test for the [uroboros](https://github.com/NicolasET/uroboros) Claude Code plugin. The same scenario runs after every uroboros minor or major release, so results can be compared version to version.

## What one run measures

For each mode — the default pipeline, `--auto`, `--goal`, and `/uroboros:compat`:

| Measure | How |
|---|---|
| **End to end** | Deterministic checks: the session ended cleanly, the artifacts exist (`spec.md`, `plan.md`, `tasks.md`, `loop-state.md` or `goal.md`), every task is checked, the fixture's gate (test, typecheck, lint) is green, the goal marker closed as `complete`, the compat verdict is `covered`. |
| **Ambiguities detected** | The scenario plants 5 product decisions the idea does not settle ([`scenario/truth.md`](./scenario/truth.md)). A pinned judge model reads the questions uroboros asked, `loop-state.md` and the artifacts, and classifies each one as asked, recorded as an assumption, decided silently, or not addressed. |
| **Correct code** | 11 hidden acceptance tests ([`scenario/hidden-tests/`](./scenario/hidden-tests/)), never shown to uroboros, are copied in after the run and executed. |
| **Cost and time** | Cost (list-price estimate), tokens, duration and number of questions, from the Agent SDK. Oracle and judge calls are counted apart. |

## How it works

- **Fixture** ([`fixture/`](./fixture/)): a minimal Node/TypeScript listings API with in-memory data, and spec-kit **1.1.0** installed from its release tag (Claude integration, `ps` scripts, git extension) — the uroboros compatibility contract's baseline. It deliberately settles none of the planted decisions.
- **Scenario** ([`scenario/`](./scenario/)): the idea uroboros receives (in Spanish, the maintainer's language), the truth the fictional user holds, and the hidden tests.
- **Oracle**: uroboros phrases its questions differently every run, so a pinned small model (`claude-haiku-4-5-20251001`) answers each `AskUserQuestion` from `truth.md` alone, and says "No sé" to anything the truth does not settle. Every exchange is logged.
- **Roles**: the orchestrator, reviewer and implementer all run on the latest Opus (`opus` alias) at **that model's own default effort**, resolved at the start of each run (the Agent SDK would otherwise default to `high`). The exact model and effort are recorded, so a model change is never mistaken for a plugin change.
- **Isolation**: sessions load project settings only (`settingSources: ['project']`), so the workspace's spec-kit skills are available and none of this machine's user settings, hooks, `CLAUDE.md` or MCP servers load. Each mode gets a fresh copy of the fixture as its own git repository, created outside the user's home — `C:\uro-testbed-work` on Windows, the OS temp directory elsewhere, or `UROBOROS_TESTBED_WORKDIR` — because Claude Code reads project instructions from every directory above the workspace (a home's `~/.claude/CLAUDE.md` would load). The harness refuses a root that has a `CLAUDE.md`, `AGENTS.md` or `.claude` above it.

## Run it

Requirements: Node.js 24+, Git, and Claude Code signed in (the Agent SDK uses that login; no API key needed).

```
npm install
npm test                                              # the harness's own checks (no model calls)
npm run testbed -- --uroboros ../uroboros             # a local checkout, e.g. before a release
npm run testbed -- --uroboros v0.13.0                 # a published tag
npm run testbed -- --uroboros ../uroboros --modes compat,goal
```

A full run takes hours and has no cost ceiling: the cost is recorded, not capped.

## Results

- `results/<version>/` — committed: `metrics.json`, `oracle-log.jsonl` and `summary.md`, which compares against the previous version that ran the same scenario version. A version that is not exactly its release tag is labeled `<version>+<commit>`.
- `runs/` — local only: each mode's full session transcript. The workspaces themselves live outside this repository (see Isolation), so uroboros can never reach `scenario/`; the run prints their paths.
