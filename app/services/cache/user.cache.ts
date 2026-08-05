import { BaseCache } from "./base.cache";

const USER_CACHE_TTL = 60 * 10;

export const UserCache = {
  for<T = unknown>(userId: string) {
    return new BaseCache<T>(`user:${userId}`, USER_CACHE_TTL);
  },
};