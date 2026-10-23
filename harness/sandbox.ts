import { isAbsolute, relative, resolve } from 'node:path';

/** The arguments through which each file tool names a path. */
const PATH_ARGS: Record<string, string[]> = {
  Read: ['file_path'],
  Write: ['file_path'],
  Edit: ['file_path'],
  MultiEdit: ['file_path'],
  NotebookEdit: ['notebook_path'],
  Glob: ['path', 'pattern'],
  Grep: ['path', 'glob'],
};
const SHELLS = new Set(['Bash', 'PowerShell']);

const inside = (path: string, root: string): boolean => {
  const rel = relative(resolve(root), resolve(path));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

/** Absolute paths a shell command names: drive paths (`C:\…`, `C:/…`), Git Bash drive paths (`/c/…`) and POSIX paths. */
export function shellPaths(command: string): string[] {
  const stop = `[^\\s'"\`;|&<>()]*`;
  const drive = command.match(new RegExp(`[A-Za-z]:[\\\\/]${stop}`, 'g')) ?? [];
  const posix = (command.match(new RegExp(`(?<![\\w.:~-])/${stop}`, 'g')) ?? []).map((p) => (/^\/[a-z]\//i.test(p) ? `${p[1]}:${p.slice(2)}` : p));
  return [...drive, ...posix];
}

export interface Fence {
  /** Where the session may read and write: its workspace, the plugin, its own temporary directory. */
  allowed: string[];
  /** What a shell command must never name outside `allowed`: the testbed, the other workspaces, the user's home. */
  sensitive: string[];
  /** Relative paths of file tools resolve against it. */
  cwd: string;
}

/**
 * The first path a tool call reaches outside the fence, or undefined. File tools may touch nothing outside `allowed`;
 * a shell command may not name a path under `sensitive` outside `allowed` (relative escapes in a command are not seen).
 */
export function outsidePath(toolName: string, input: Record<string, unknown>, fence: Fence, blockedPath?: string): string | undefined {
  const permitted = (p: string) => fence.allowed.some((root) => inside(p, root));
  if (SHELLS.has(toolName)) {
    const named = [...shellPaths(String(input.command ?? '')), ...(blockedPath ? [blockedPath] : [])];
    return named.find((p) => !permitted(p) && fence.sensitive.some((root) => inside(p, root)));
  }
  const paths = (PATH_ARGS[toolName] ?? []).map((key) => input[key]).filter((v): v is string => typeof v === 'string' && v.length > 0);
  return [...paths.map((p) => resolve(fence.cwd, p)), ...(blockedPath ? [blockedPath] : [])].find((p) => !permitted(p));
}
