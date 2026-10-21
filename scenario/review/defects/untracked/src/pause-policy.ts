import type { Listing, User } from './domain.ts';

/** Who may pause or resume a listing: its seller, or an admin. */
export function canChangePause(user: User, listing: Listing): boolean {
  return user.role === 'admin' || (user.role === 'seller' && listing.status === 'active') || listing.sellerId === user.id;
}
