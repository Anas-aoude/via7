import { BaseCache } from "./base.cache";

const SEARCH_CACHE_TTL = 60 * 2;

export const SearchCache = {
  for(key: string) {
    return new BaseCache(
      `search:${key}`,
      SEARCH_CACHE_TTL
    );
  },
};