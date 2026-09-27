export type Role = 'seller' | 'buyer' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type ListingStatus = 'active';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  priceCents: number;
  status: ListingStatus;
  /** Grows with every order; search results are sorted by it, highest first. */
  rankScore: number;
  createdAt: string;
}

export type OrderStatus = 'open' | 'fulfilled' | 'cancelled';

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  status: OrderStatus;
  createdAt: string;
}
