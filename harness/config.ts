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

/** Bump whenever idea.md, truth.md, the hidden tests or the fixture change: results of different scenario versions are never compared. */
export const SCENARIO_VERSION = 2;

export const UROBOROS_REPO_URL = 'https://github.com/NicolasET/uroboros.git';

/** The three uroboros roles run on the latest Opus; the effort is its own default, resolved at run start. */
export const ROLE_MODEL_ALIAS = 'opus';
/** Pinned by exact id so answers and verdicts do not drift between runs. */
export const ORACLE_MODEL = 'claude-haiku-4-5-20251001';
export const JUDGE_MODEL = 'claude-sonnet-5';

export const MODES = ['default', 'auto', 'goal', 'compat'] as const;
export type Mode = (typeof MODES)[number];

/** Wall-clock guard per mode; a full pipeline run takes well under this. */
export const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;
