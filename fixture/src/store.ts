import type { Listing, Order, User } from './domain.ts';

/** In-memory persistence. Every server start (and every test) gets a fresh store. */
export class Store {
  readonly users = new Map<string, User>();
  readonly listings = new Map<string, Listing>();
  readonly orders = new Map<string, Order>();
  private sequence = 0;

  nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence}`;
  }

  now(): string {
    return new Date().toISOString();
  }
}

export function seededStore(): Store {
  const store = new Store();
  const users: User[] = [
    { id: 'u_seller_ana', name: 'Ana', role: 'seller' },
    { id: 'u_seller_leo', name: 'Leo', role: 'seller' },
    { id: 'u_buyer_sam', name: 'Sam', role: 'buyer' },
    { id: 'u_admin_kim', name: 'Kim', role: 'admin' },
  ];
  for (const user of users) store.users.set(user.id, user);

  const listings: Listing[] = [
    { id: 'l_lamp', sellerId: 'u_seller_ana', title: 'Desk lamp', priceCents: 2500, status: 'active', rankScore: 12, createdAt: '2026-01-10T10:00:00.000Z' },
    { id: 'l_chair', sellerId: 'u_seller_ana', title: 'Office chair', priceCents: 12000, status: 'active', rankScore: 30, createdAt: '2026-01-11T10:00:00.000Z' },
    { id: 'l_desk', sellerId: 'u_seller_leo', title: 'Standing desk', priceCents: 40000, status: 'active', rankScore: 21, createdAt: '2026-01-12T10:00:00.000Z' },
  ];
  for (const listing of listings) store.listings.set(listing.id, listing);

  const order: Order = { id: 'o_seed', listingId: 'l_chair', buyerId: 'u_buyer_sam', status: 'open', createdAt: '2026-02-01T10:00:00.000Z' };
  store.orders.set(order.id, order);
  return store;
}
