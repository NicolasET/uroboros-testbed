import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURE_DIR = join(ROOT, 'fixture');
export const SCENARIO_DIR = join(ROOT, 'scenario');
export const RESULTS_DIR = join(ROOT, 'results');
/** Local only (gitignored): workspaces and full transcripts of every run. */
export const RUNS_DIR = join(ROOT, 'runs');
export const PROBE_PLUGIN_DIR = join(ROOT, 'harness', 'probe-plugin');
/**
 * Where each mode's workspace is created. Sessions load project settings (the fixture's spec-kit skills), and
 * Claude Code reads project instructions from every directory above the workspace — so this must sit outside
 * the user's home, whose ~/.claude/CLAUDE.md would otherwise load as a project file. Checked by workspace.ts.
 */
export const WORKSPACES_ROOT = process.env.UROBOROS_TESTBED_WORKDIR ?? (process.platform === 'win32' ? 'C:/uro-testbed-work' : tmpdir());

/** Bump whenever idea.md, truth.md, the hidden tests, the fixture or the oracle's rules change: results of different scenario versions are never compared. v3: the oracle states its corrections whatever the rejecting option is called, and never answers empty. v4: it never keeps a delegated decision open. v5: the fixture moves to spec-kit 1.1.0. v6: the fixture's server answers only a published route table (`src/gateway.ts`) that the in-process tests bypass, and hidden runtime tests start the real server. v7: the pipeline workspaces start with three standing decisions (`scenario/standing-decisions.md`) — the idea contradicts S1 and S3, S2 states what runs used to offer as new — and truth.md settles them and answers "I don't know" to every list of minor cases; the oracle never answers an option that asks which and how with its bare label. */
export const SCENARIO_VERSION = 7;

/** Seeded as `.uroboros/decisions.md` into the workspaces of these modes only: the eval modes measure a fixed spec it would contradict. */
export const STANDING_DECISIONS_SEED = join(SCENARIO_DIR, 'standing-decisions.md');
export const STANDING_DECISIONS_MODES: readonly Mode[] = ['default', 'auto', 'goal'];

/** The verifier eval (`verify` mode, `scenario/verify/`) is versioned apart: it changes nothing the other modes measure. Bump it whenever `scenario/verify/`, its scoring or the fixture (which its workspaces copy) changes; the `verify` row is compared only within one eval version. v2: FR-006 (an unknown listing id is refused with 404) and the `edge` case, whose defect breaks it where no scenario looks; probe failures are scored (uroboros 0.20.0+). */
export const VERIFY_EVAL_VERSION = 2;
/** Runs per verifier eval case: the verifier is not deterministic, so each case reports a rate. */
export const VERIFY_EVAL_RUNS = 3;

/** The reviewer eval (`review` mode, `scenario/review/`) is versioned apart, like the verifier eval. Bump it whenever `scenario/review/`, its prompts, its scoring or the fixture change; the `review` row is compared only within one eval version. */
export const REVIEW_EVAL_VERSION = 1;
/** Runs per reviewer eval case. */
export const REVIEW_EVAL_RUNS = 3;

export const UROBOROS_REPO_URL = 'https://github.com/NicolasET/uroboros.git';

/** The three uroboros roles run on the latest Opus; the effort is its own default, resolved at run start. */
export const ROLE_MODEL_ALIAS = 'opus';
/** Pinned by exact id so answers and verdicts do not drift between runs. */
export const ORACLE_MODEL = 'claude-haiku-4-5-20251001';
export const JUDGE_MODEL = 'claude-sonnet-5';

export const MODES = ['default', 'auto', 'goal', 'compat', 'verify', 'review'] as const;
export type Mode = (typeof MODES)[number];

/** Wall-clock guard per mode; a full pipeline run takes well under this. */
export const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;

/**
 * How long a session must stay quiet after an idle result before its input closes. A finished subagent's report
 * can arrive in a turn of its own after a result with no background task left; closing at once made every later
 * tool call fail with "Stream closed" (seen twice in default mode, right after verification).
 */
export const IDLE_CLOSE_MS = 30 * 1000;
