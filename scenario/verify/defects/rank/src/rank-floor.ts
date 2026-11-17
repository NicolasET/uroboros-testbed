import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Store } from './store.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

const ACTION = /^\/listings\/([^/]+)\/(?:pause|resume)$/;
/** The rank a listing gets once it has been handled, so it does not sit below every ranked one. */
const RANK_FLOOR = 1;

/** After a pause or resume, a listing with no rank yet gets the floor rank. */
export function withRankFloor(app: Handler, store: Store): Handler {
  return async (req, res) => {
    await app(req, res);
    const id = ACTION.exec(new URL(req.url ?? '/', 'http://localhost').pathname)?.[1];
    const listing = req.method === 'POST' && id ? store.listings.get(id) : undefined;
    if (listing && !listing.rankScore) listing.rankScore = RANK_FLOOR;
  };
}
