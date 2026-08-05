import { BaseCache } from "./base.cache";

const FAVORITES_CACHE_TTL = 60 * 5;

export const FavoritesCache = {
  for(userId: string) {
    return new BaseCache(
      `favorites:${userId}`,
      FAVORITES_CACHE_TTL
    );
  },
};