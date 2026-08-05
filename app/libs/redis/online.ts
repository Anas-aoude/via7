import redis from "./index";

const getOnlineKey = (userId: string) => `online:${userId}`;

export const OnlineService = {
  async setOnline(userId: string, socketId: string) {
    if (!userId || !socketId) return;

    const key = getOnlineKey(userId);

    await redis.sadd(key, socketId);
    await redis.expire(key, 60 * 60);
  },

  async setOffline(userId: string, socketId: string) {
    if (!userId || !socketId) return false;

    const key = getOnlineKey(userId);

    await redis.srem(key, socketId);

    const count = await redis.scard(key);

    if (count === 0) {
      await redis.del(key);
      return true;
    }

    return false;
  },

  async isOnline(userId: string) {
    if (!userId) return false;

    const key = getOnlineKey(userId);
    const count = await redis.scard(key);

    return count > 0;
  },

  async getOnlineSocketCount(userId: string) {
    if (!userId) return 0;

    const key = getOnlineKey(userId);

    return redis.scard(key);
  },
};