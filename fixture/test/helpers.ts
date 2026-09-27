import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.ts';
import { seededStore, type Store } from '../src/store.ts';

export interface TestApi {
  store: Store;
  request(method: string, path: string, options?: { as?: string; body?: unknown }): Promise<{ status: number; body: any }>;
  close(): Promise<void>;
}

/** Starts the app on an ephemeral port over a fresh seeded store. */
export async function startApi(): Promise<TestApi> {
  const store = seededStore();
  const server: Server = createServer(createApp(store));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    store,
    async request(method, path, options = {}) {
      const headers: Record<string, string> = {};
      if (options.as) headers['x-user-id'] = options.as;
      if (options.body !== undefined) headers['content-type'] = 'application/json';
      const res = await fetch(base + path, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      return { status: res.status, body: await res.json() };
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
