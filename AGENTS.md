# AGENTS.md — working on the uroboros testbed

This repository measures the [uroboros](https://github.com/NicolasET/uroboros) plugin; its value is that the measurement stays the same from one uroboros version to the next. The rules and process of the uroboros repository's own AGENTS.md apply here too (interview the maintainer before changing behavior, plan approval, coherence sweep, no Claude commit trailers, talk to the maintainer in Spanish).

## Invariants

1. **The scenario is fixed.** `scenario/idea.md`, `scenario/truth.md`, `scenario/hidden-tests/`, `fixture/` and the oracle's rules (`harness/oracle.ts`) define what is measured. Never change them silently. A change needs the maintainer's approval and a bump of `SCENARIO_VERSION` in `harness/config.ts`; results of different scenario versions are never compared. `scenario/verify/` defines the verifier eval (`verify` mode) apart: a change there, or to its scoring, bumps `VERIFY_EVAL_VERSION` instead, and the `verify` row is compared only within one eval version.
2. **The fixture decides none of the planted ambiguities.** No code in `fixture/` may settle who pauses, visibility, ordering, rank preservation or idempotency — otherwise uroboros has nothing to ask.
3. **uroboros never sees the answers.** The hidden tests, `truth.md` and `harness/reference/` stay out of every workspace until the run ends. The `verify` workspaces are the exception by design: that mode measures the verifier, not ambiguity detection, so its product is the reference implementation with a planted defect, under a fixed spec.
4. **Pinned graders.** The oracle and judge models are exact model ids. The role model follows the latest Opus at its own default effort, and every result records the exact model and effort.
5. **Isolated sessions.** Sessions load project settings only (`settingSources: ['project']`, for the fixture's spec-kit skills), in workspaces outside the user's home with no `CLAUDE.md`, `AGENTS.md` or `.claude` above them (`assertIsolatedRoot`). Nothing from the machine running the testbed may influence a result.
6. **Results are data.** Never edit a committed `results/` file by hand; re-run instead.

## Verifying a change to the harness

- `npm run typecheck` and `npm test` (the hidden tests must fail 11/11 on the bare fixture and pass 11/11 on `harness/reference/`, with a green gate; the runtime tests must fail 3/3 on the bare fixture and pass 3/3 on the reference; every verifier eval case must pass the hidden tests 11/11 in process with a green gate, while a probe of its running server shows its defect, and nothing on the clean copy).
- After a change to how a session runs, run one mode for real (`--modes compat` is the shortest) before a full run.
