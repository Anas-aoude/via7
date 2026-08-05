import { BaseCache } from "./base.cache";

const ADMIN_CACHE_TTL = 60;

export const AdminCache = {
  for(key: string) {
    return new BaseCache(
      `admin:${key}`,
      ADMIN_CACHE_TTL
    );
  },
};