import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/** How long a search result is served from the cache. */
export const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

/** Writes that change what search returns; a successful one empties the cache. */
export const INVALIDATED_BY = ['POST /listings', 'POST /listings/:id/orders'];

function matches(route: string, method: string, path: string): boolean {
  const [routeMethod, routePath = ''] = route.split(' ');
  const expected = routePath.split('/').filter(Boolean);
  const actual = path.split('/').filter(Boolean);
  return (
    routeMethod === method &&
    expected.length === actual.length &&
    expected.every((segment, i) => segment.startsWith(':') || segment === actual[i])
  );
}

/** Caches `GET /listings` responses per query string in front of the app (see server.ts). */
export function withSearchCache(app: Handler, ttlMs = SEARCH_CACHE_TTL_MS): Handler {
  const cache = new Map<string, { body: string; expires: number }>();
  return async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    const parts = url.pathname.split('/').filter(Boolean);

    if (method === 'GET' && parts.length === 1 && parts[0] === 'listings') {
      const hit = cache.get(url.search);
      if (hit && hit.expires > Date.now()) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(hit.body);
        return;
      }
      const end = res.end.bind(res) as (chunk?: unknown) => ServerResponse;
      res.end = ((chunk?: unknown) => {
        if (res.statusCode === 200 && typeof chunk === 'string') cache.set(url.search, { body: chunk, expires: Date.now() + ttlMs });
        return end(chunk);
      }) as typeof res.end;
      return app(req, res);
    }

    await app(req, res);
    const succeeded = res.statusCode >= 200 && res.statusCode < 300;
    if (succeeded && INVALIDATED_BY.some((route) => matches(route, method, url.pathname))) cache.clear();
  };
}
