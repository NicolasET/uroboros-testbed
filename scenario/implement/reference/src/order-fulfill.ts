import type { IncomingMessage, ServerResponse } from 'node:http';
import { currentUser } from './auth.ts';
import { sendError, sendJson } from './http.ts';
import type { Store } from './store.ts';

/** POST /orders/:id/fulfill — the seller who owns the order's listing marks an open order fulfilled. */
export function fulfillOrder(orderId: string, req: IncomingMessage, res: ServerResponse, store: Store): void {
  const user = currentUser(req, store);
  if (!user) return sendError(res, 401, 'unauthenticated');
  const order = store.orders.get(orderId);
  if (!order) return sendError(res, 404, 'order_not_found');
  if (store.listings.get(order.listingId)?.sellerId !== user.id) return sendError(res, 403, 'not_order_seller');
  if (order.status !== 'open') return sendError(res, 409, 'order_not_open');

  order.status = 'fulfilled';
  sendJson(res, 200, order);
}
