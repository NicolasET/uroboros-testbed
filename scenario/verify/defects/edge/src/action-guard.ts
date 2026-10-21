import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendError } from './http.ts';
import type { Store } from './store.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

const ACTION = /^\/listings\/([^/]+)\/(?:pause|resume)$/;

/** Answers a pause or resume of a listing id the store does not hold as a refusal, so listing ids cannot be enumerated. */
export function withActionGuard(app: Handler, store: Store): Handler {
  return async (req, res) => {
    const id = ACTION.exec(new URL(req.url ?? '/', 'http://localhost').pathname)?.[1];
    if (req.method === 'POST' && id && !store.listings.has(id)) return sendError(res, 403, 'not_listing_owner');
    return app(req, res);
  };
}
