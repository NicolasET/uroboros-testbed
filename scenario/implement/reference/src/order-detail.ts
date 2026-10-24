import type { IncomingMessage, ServerResponse } from 'node:http';
import { currentUser } from './auth.ts';
import { sendError, sendJson } from './http.ts';
import type { Store } from './store.ts';

/** GET /orders/:id — the order's buyer, the seller who owns its listing, and admins see one order. */
export function getOrder(orderId: string, req: IncomingMessage, res: ServerResponse, store: Store): void {
  const user = currentUser(req, store);
  if (!user) return sendError(res, 401, 'unauthenticated');
  const order = store.orders.get(orderId);
  if (!order) return sendError(res, 404, 'order_not_found');
  const party = user.role === 'admin' || order.buyerId === user.id || store.listings.get(order.listingId)?.sellerId === user.id;
  if (!party) return sendError(res, 403, 'not_order_party');

  sendJson(res, 200, order);
}
