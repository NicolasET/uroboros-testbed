import type { IncomingMessage, ServerResponse } from 'node:http';
import { currentUser } from './auth.ts';
import type { Order } from './domain.ts';
import { sendError, sendJson } from './http.ts';
import { ORDER_RANK_BOOST } from './ranking.ts';
import type { Store } from './store.ts';

/** POST /listings/:id/orders — a buyer orders a listing; the listing gains rank. */
export function placeOrder(listingId: string, req: IncomingMessage, res: ServerResponse, store: Store): void {
  const user = currentUser(req, store);
  if (!user) return sendError(res, 401, 'unauthenticated');
  if (user.role !== 'buyer') return sendError(res, 403, 'only_buyers_can_order');

  const listing = store.listings.get(listingId);
  if (!listing) return sendError(res, 404, 'listing_not_found');
  if (listing.status === 'paused') return sendError(res, 409, 'listing_paused'); // P3

  const order: Order = { id: store.nextId('o'), listingId, buyerId: user.id, status: 'open', createdAt: store.now() };
  store.orders.set(order.id, order);
  listing.rankScore += ORDER_RANK_BOOST;
  sendJson(res, 201, order);
}

/** GET /orders — buyers see their own orders; sellers see orders on their listings; admins see all. */
export function listOrders(req: IncomingMessage, res: ServerResponse, store: Store): void {
  const user = currentUser(req, store);
  if (!user) return sendError(res, 401, 'unauthenticated');

  const visible = [...store.orders.values()].filter((order) => {
    if (user.role === 'admin') return true;
    if (user.role === 'buyer') return order.buyerId === user.id;
    return store.listings.get(order.listingId)?.sellerId === user.id;
  });
  sendJson(res, 200, visible);
}
