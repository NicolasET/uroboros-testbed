import type { IncomingMessage } from 'node:http';
import type { User } from './domain.ts';
import type { Store } from './store.ts';

/** Resolves the caller from the `x-user-id` header; undefined when absent or unknown. */
export function currentUser(req: IncomingMessage, store: Store): User | undefined {
  const header = req.headers['x-user-id'];
  const id = Array.isArray(header) ? header[0] : header;
  return id ? store.users.get(id) : undefined;
}
