import redis from "@/app/libs/redis";

const isBuild = process.env.npm_lifecycle_event === "build";

export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    if (!key || isBuild) return null;

    const value = await redis.get(key);


    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 300) {
    if (!key || isBuild) return;


    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key: string) {
    if (!key || isBuild) return;

    await redis.del(key);
  },

  async exists(key: string) {
    if (!key || isBuild) return false;

    const result = await redis.exists(key);

    return result === 1;
  },

  async delByPattern(pattern: string) {
    if (!pattern || isBuild) return;

    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};