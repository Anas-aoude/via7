import redis from "./index";

export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    if (!key) return null;

    const value = await redis.get(key);

    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 60) {
    if (!key) return;

    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key: string) {
    if (!key) return;

    await redis.del(key);
  },
};