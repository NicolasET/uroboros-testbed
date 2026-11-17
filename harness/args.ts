import { DEFAULT_MODES, MODES, type Mode } from './config.ts';

export interface RunArgs {
  /** A local path to a uroboros checkout, or a git ref (tag or branch) of the published repo. */
  uroboros: string;
  modes: Mode[];
  /** Pilot only: the eval cases to run (`--cases rule,rank`); the result then stays in the run directory, never in `results/`. */
  cases?: string[];
}

const USAGE = 'usage: npm run testbed -- --uroboros <path|tag|branch> [--modes default,auto,goal,compat,verify,review,implement] [--cases <eval case names>]';

export function parseArgs(argv: string[]): RunArgs {
  let uroboros = '../uroboros';
  let modes: Mode[] = [...DEFAULT_MODES];
  let cases: string[] | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--uroboros' && value) {
      uroboros = value;
      i++;
    } else if (arg === '--modes' && value) {
      modes = value.split(',').map((m) => m.trim()) as Mode[];
      i++;
    } else if (arg === '--cases' && value) {
      cases = value.split(',').map((c) => c.trim()).filter(Boolean);
      i++;
    } else {
      throw new Error(`unknown argument "${arg}"\n${USAGE}`);
    }
  }
  const unknown = modes.filter((m) => !MODES.includes(m));
  if (unknown.length) throw new Error(`unknown mode(s): ${unknown.join(', ')}\n${USAGE}`);
  return cases ? { uroboros, modes, cases } : { uroboros, modes };
}
