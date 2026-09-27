import { spawn } from 'node:child_process';

export interface ExecResult {
  code: number;
  output: string;
}

/** Runs a command to completion and returns its exit code with stdout and stderr interleaved. */
export function exec(command: string, args: string[], cwd: string, timeoutMs = 10 * 60 * 1000): Promise<ExecResult> {
  return new Promise((resolve) => {
    // A child test runner must not inherit NODE_TEST_CONTEXT (it would report to our runner, not print TAP).
    const { NODE_TEST_CONTEXT: _inherited, ...env } = process.env;
    const child = spawn(command, args, { cwd, shell: process.platform === 'win32', env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, output });
    });
  });
}

export async function execOrThrow(command: string, args: string[], cwd: string): Promise<string> {
  const { code, output } = await exec(command, args, cwd);
  if (code !== 0) throw new Error(`${command} ${args.join(' ')} failed (${code}):\n${output}`);
  return output.trim();
}
