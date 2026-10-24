import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendError } from './http.ts';
import { createListing, getListing, searchListings } from './listings.ts';
import { cancelOrder } from './order-cancel.ts';
import { getOrder } from './order-detail.ts';
import { fulfillOrder } from './order-fulfill.ts';
import { listOrders, placeOrder } from './orders.ts';
import type { Store } from './store.ts';

/** Routes a request to its handler. Unknown routes answer 404. */
export function createApp(store: Store) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    const method = req.method ?? 'GET';

    if (parts[0] === 'listings') {
      const id = parts[1];
      if (!id && method === 'GET') return searchListings(url, res, store);
      if (!id && method === 'POST') return createListing(req, res, store);
      if (id && parts.length === 2 && method === 'GET') return getListing(id, res, store);
      if (id && parts[2] === 'orders' && parts.length === 3 && method === 'POST') return placeOrder(id, req, res, store);
    }
    if (parts[0] === 'orders') {
      const id = parts[1];
      if (!id && method === 'GET') return listOrders(req, res, store);
      if (id && parts.length === 2 && method === 'GET') return getOrder(id, req, res, store);
      if (id && parts[2] === 'cancel' && parts.length === 3 && method === 'POST') return cancelOrder(id, req, res, store);
      if (id && parts[2] === 'fulfill' && parts.length === 3 && method === 'POST') return fulfillOrder(id, req, res, store);
    }

    sendError(res, 404, 'route_not_found');
  };
}
