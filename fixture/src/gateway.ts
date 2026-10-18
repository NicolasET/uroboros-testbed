import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendError } from './http.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/** The API's published routes. The server answers only these; any other request is 404 before it reaches the app. */
export const PUBLIC_ROUTES = [
  'GET /listings',
  'POST /listings',
  'GET /listings/:id',
  'POST /listings/:id/orders',
  'GET /orders',
];

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

/** Puts the published route table in front of the app (see server.ts). */
export function withPublicRoutes(app: Handler, routes: readonly string[] = PUBLIC_ROUTES): Handler {
  return async (req, res) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const method = req.method ?? 'GET';
    if (!routes.some((route) => matches(route, method, path))) return sendError(res, 404, 'route_not_found');
    return app(req, res);
  };
}
