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

/** Bump whenever idea.md, truth.md, the hidden tests, the fixture or the oracle's rules change: results of different scenario versions are never compared. v3: the oracle states its corrections whatever the rejecting option is called, and never answers empty. v4: it never keeps a delegated decision open. v5: the fixture moves to spec-kit 1.1.0. v6: the fixture's server answers only a published route table (`src/gateway.ts`) that the in-process tests bypass, and hidden runtime tests start the real server. */
export const SCENARIO_VERSION = 6;

/** The verifier eval (`verify` mode, `scenario/verify/`) is versioned apart: it changes nothing the other modes measure. Bump it whenever `scenario/verify/` or its scoring changes; the `verify` row is compared only within one eval version. */
export const VERIFY_EVAL_VERSION = 1;
/** Runs per verifier eval case: the verifier is not deterministic, so each case reports a rate. */
export const VERIFY_EVAL_RUNS = 3;

/** The reviewer eval (`review` mode, `scenario/review/`) is versioned apart, like the verifier eval. Bump it whenever `scenario/review/`, its prompts or its scoring change; the `review` row is compared only within one eval version. */
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
