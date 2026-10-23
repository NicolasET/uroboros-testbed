import type { Listing } from './domain.ts';

/** Points a listing gains each time it is ordered. */
export const ORDER_RANK_BOOST = 1;

/** Search order: highest rankScore first; ties broken by the newest listing. */
export function byRank(a: Listing, b: Listing): number {
  return b.rankScore - a.rankScore || b.createdAt.localeCompare(a.createdAt);
}
