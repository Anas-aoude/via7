import { BaseCache } from "./base.cache";

const LISTING_CACHE_TTL = 60 * 10;

export const ListingCache = {
  for<T>(listingId: string) {
    return new BaseCache<T>(
      `listing:v2:${listingId}`,
      LISTING_CACHE_TTL
    );
  },
};