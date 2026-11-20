/** Compares two `x.y.z` versions: negative when a < b, 0 when equal, positive when a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

export const atLeast = (version: string, min: string): boolean => compareVersions(version, min) >= 0;

/** From this uroboros version every run is one flow: no spec-kit pipeline, no `--goal` mode, no compat skill; artifacts live under `.uroboros/`. */
export const SINGLE_FLOW_FROM = '1.0.0';

/** From this uroboros version each role is one agent and the effort travels on the Agent call; before it, one agent variant per effort. */
export const ONE_AGENT_FROM = '0.32.0';

/** How a dispatch names a role's agent for the measured version: the agent type and the model, and from 0.32.0 the effort on the call. */
export function agentCall(role: 'reviewer' | 'implementer' | 'verifier', profile: { alias: string; effort: string }, version: string): string {
  return atLeast(version, ONE_AGENT_FROM)
    ? `subagent_type \`uroboros:uroboros-${role}\`, model \`${profile.alias}\`, effort \`${profile.effort}\``
    : `subagent_type \`uroboros:uroboros-${role}-${profile.effort}\`, model \`${profile.alias}\``;
}
