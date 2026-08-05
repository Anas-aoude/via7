import { BaseCache } from "./base.cache";

const NOTIFICATION_CACHE_TTL = 30;

export const NotificationCache = {
  for(userId: string) {
    return new BaseCache(
      `notifications:${userId}`,
      NOTIFICATION_CACHE_TTL
    );
  },
};