import { MODES, type Mode } from './config.ts';

export interface RunArgs {
  /** A local path to a uroboros checkout, or a git ref (tag or branch) of the published repo. */
  uroboros: string;
  modes: Mode[];
}

const USAGE = 'usage: npm run testbed -- --uroboros <path|tag|branch> [--modes default,auto,goal,compat]';

export function parseArgs(argv: string[]): RunArgs {
  let uroboros = '../uroboros';
  let modes: Mode[] = [...MODES];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--uroboros' && value) {
      uroboros = value;
      i++;
    } else if (arg === '--modes' && value) {
      modes = value.split(',').map((m) => m.trim()) as Mode[];
      i++;
    } else {
      throw new Error(`unknown argument "${arg}"\n${USAGE}`);
    }
  }
  const unknown = modes.filter((m) => !MODES.includes(m));
  if (unknown.length) throw new Error(`unknown mode(s): ${unknown.join(', ')}\n${USAGE}`);
  return { uroboros, modes };
}
