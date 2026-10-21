import { existsSync, readFileSync } from 'node:fs';

/**
 * The reports a subagent returned in a session's transcript, in order, identified by the contract header they open
 * with (`VERIFIER-REPORT`, `LOOP-REVIEW-FINDINGS`), sometimes inside the code fence the contract shows them in. A
 * subagent's final report reaches the session as a `task_notification` whose summary is the report text, so each
 * report appears once.
 */
export function subagentReports(transcriptPath: string, header: string): string[] {
  if (!existsSync(transcriptPath)) return [];
  // A fence of three or more backticks: models widen it when the report itself shows a fence.
  const start = new RegExp(`^\\s*(?:\`{3,}\\w*\\s*)?${header}\\b`);
  const reports: string[] = [];
  for (const line of readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.includes(header)) continue;
    const m = JSON.parse(line) as { type?: string; subtype?: string; summary?: string };
    if (m.type === 'system' && m.subtype === 'task_notification' && start.test(m.summary ?? '')) reports.push(m.summary ?? '');
  }
  return reports;
}
