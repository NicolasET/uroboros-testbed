// What a single-flow run (uroboros 1.0.0+) did, read from its state file, its transcript and its workspace:
// the size it recorded, which subagents it dispatched, and where it kept what the user typed.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { featureDir, readIfExists } from './artifacts.ts';

export type Size = 'small' | 'medium' | 'large';

export interface FlowShape {
  /** The last `SIZE:` line of loop-state.md; absent when the run recorded none. */
  size?: Size;
  dispatches: { implementer: number; reviewer: number; refuter: number; verifier: number };
  /** The `PHASE:` of each reviewer dispatch, in order (`goal`, `plan`, `implement`). */
  reviewPhases: string[];
  /** A reviewer judged `goal.md` on its own before the first implementer was dispatched. */
  goalReviewedBeforeCode: boolean;
  planWritten: boolean;
  /** A private record of what the user typed exists inside `.git`. */
  privateRecordInGit: boolean;
}

interface Dispatch {
  role: 'implementer' | 'reviewer' | 'refuter' | 'verifier';
  phase?: string;
}

interface ToolUse {
  type?: string;
  input?: { subagent_type?: unknown; prompt?: unknown };
}

/** The role of each subagent the session dispatched, in order. The refuter runs on the reviewer agent, told apart by its instructions file. */
export function dispatches(transcriptPath: string): Dispatch[] {
  if (!existsSync(transcriptPath)) return [];
  const found: Dispatch[] = [];
  for (const line of readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.includes('uroboros-')) continue;
    const m = JSON.parse(line) as { type?: string; message?: { content?: unknown } };
    if (m.type !== 'assistant' || !Array.isArray(m.message?.content)) continue;
    for (const block of m.message.content as ToolUse[]) {
      if (block.type !== 'tool_use' || typeof block.input?.subagent_type !== 'string') continue;
      const agent = /uroboros-(reviewer|implementer|verifier)/.exec(block.input.subagent_type)?.[1];
      if (!agent) continue;
      const prompt = typeof block.input.prompt === 'string' ? block.input.prompt : '';
      if (agent === 'reviewer') {
        if (prompt.includes('refuter-instructions')) found.push({ role: 'refuter' });
        else found.push({ role: 'reviewer', phase: /PHASE:\s*`?([a-z-]+)/i.exec(prompt)?.[1]?.toLowerCase() });
      } else {
        found.push({ role: agent as 'implementer' | 'verifier' });
      }
    }
  }
  return found;
}

/** The size loop-state.md records last: a run may raise it mid-way. */
export function recordedSize(state: string): Size | undefined {
  // Written as a `SIZE: <size>` line or, in some runs, as a `## SIZE` section whose first line opens with the size.
  const all = [...state.matchAll(/^(?:SIZE:[ \t]*|#+[ \t]*SIZE[ \t]*\r?\n+)[`*]*[ \t]*(small|medium|large)\b/gim)];
  return all.at(-1)?.[1]?.toLowerCase() as Size | undefined;
}

/** Where the plugin keeps what the user typed: in the repository's shared `.git`, which a worktree's `.git` file points into. */
export function privateRecordDir(workspace: string): string {
  const dotGit = join(workspace, '.git');
  if (!existsSync(dotGit) || statSync(dotGit).isDirectory()) return join(dotGit, 'uroboros', 'private');
  const gitDir = resolve(workspace, readFileSync(dotGit, 'utf8').replace(/^gitdir:\s*/, '').trim());
  const common = join(gitDir, 'commondir');
  return join(existsSync(common) ? resolve(gitDir, readFileSync(common, 'utf8').trim()) : gitDir, 'uroboros', 'private');
}

function hasPrivateRecord(workspace: string): boolean {
  const dir = privateRecordDir(workspace);
  return existsSync(dir) && readdirSync(dir).some((name) => name.endsWith('.md') && statSync(join(dir, name)).size > 0);
}

export function readFlow(workspace: string, transcriptPath: string): FlowShape {
  const dir = featureDir(workspace, '.uroboros');
  const all = dispatches(transcriptPath);
  const count = (role: Dispatch['role']) => all.filter((d) => d.role === role).length;
  const firstImplementer = all.findIndex((d) => d.role === 'implementer');
  const beforeCode = firstImplementer < 0 ? all : all.slice(0, firstImplementer);
  return {
    size: recordedSize(readIfExists(dir && join(dir, 'loop-state.md'), Number.MAX_SAFE_INTEGER)),
    dispatches: { implementer: count('implementer'), reviewer: count('reviewer'), refuter: count('refuter'), verifier: count('verifier') },
    reviewPhases: all.filter((d) => d.role === 'reviewer').map((d) => d.phase ?? '?'),
    goalReviewedBeforeCode: beforeCode.some((d) => d.role === 'reviewer' && d.phase === 'goal'),
    planWritten: !!dir && existsSync(join(dir, 'plan.md')),
    privateRecordInGit: hasPrivateRecord(workspace),
  };
}

/** Whether any file under `.uroboros/` holds the start of the idea as the user typed it (uroboros 1.0.0+ keeps it inside `.git`). */
export function ideaInProjectFiles(workspace: string, idea: string): string | undefined {
  const flat = (text: string) => text.replace(/\s+/g, ' ').trim();
  const needle = flat(idea).slice(0, 60);
  const walk = (dir: string): string | undefined => {
    if (!existsSync(dir)) return undefined;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      const hit = entry.isDirectory() ? walk(path) : flat(readFileSync(path, 'utf8')).includes(needle) ? path : undefined;
      if (hit) return hit;
    }
    return undefined;
  };
  return walk(join(workspace, '.uroboros'));
}
