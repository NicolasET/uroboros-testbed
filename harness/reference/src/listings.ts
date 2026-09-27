import type { IncomingMessage, ServerResponse } from 'node:http';
import { currentUser } from './auth.ts';
import type { Listing } from './domain.ts';
import { readJson, sendError, sendJson } from './http.ts';
import { byRank } from './ranking.ts';
import type { Store } from './store.ts';

/** GET /listings?q= — active listings whose title contains q, best ranked first (P2: paused ones are hidden). */
export function searchListings(url: URL, res: ServerResponse, store: Store): void {
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const results = [...store.listings.values()]
    .filter((l) => l.status === 'active' && l.title.toLowerCase().includes(q))
    .sort(byRank);
  sendJson(res, 200, results);
}

/** GET /listings/:id */
export function getListing(id: string, res: ServerResponse, store: Store): void {
  const listing = store.listings.get(id);
  if (!listing) return sendError(res, 404, 'listing_not_found');
  sendJson(res, 200, listing);
}

/** POST /listings — a seller publishes a new listing; it starts with no rank. */
export async function createListing(req: IncomingMessage, res: ServerResponse, store: Store): Promise<void> {
  const user = currentUser(req, store);
  if (!user) return sendError(res, 401, 'unauthenticated');
  if (user.role !== 'seller') return sendError(res, 403, 'only_sellers_can_publish');

  const body = (await readJson(req)) as { title?: unknown; priceCents?: unknown } | undefined;
  if (!body || typeof body.title !== 'string' || !body.title.trim()) return sendError(res, 400, 'invalid_title');
  if (typeof body.priceCents !== 'number' || !Number.isInteger(body.priceCents) || body.priceCents <= 0) {
    return sendError(res, 400, 'invalid_price');
  }

  const listing: Listing = {
    id: store.nextId('l'),
    sellerId: user.id,
    title: body.title.trim(),
    priceCents: body.priceCents,
    status: 'active',
    rankScore: 0,
    createdAt: store.now(),
  };
  store.listings.set(listing.id, listing);
  sendJson(res, 201, listing);
}

/** POST /listings/:id/pause and /resume — the owner or an admin (P1); idempotent (P5); rankScore untouched (P4). */
export function setPaused(id: string, paused: boolean, req: IncomingMessage, res: ServerResponse, store: Store): void {
  const user = currentUser(req, store);
  if (!user) return sendError(res, 401, 'unauthenticated');
  const listing = store.listings.get(id);
  if (!listing) return sendError(res, 404, 'listing_not_found');
  if (user.role !== 'admin' && listing.sellerId !== user.id) return sendError(res, 403, 'not_listing_owner');
  listing.status = paused ? 'paused' : 'active';
  sendJson(res, 200, listing);
}
