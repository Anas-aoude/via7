import redis from "./index";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export const RateLimitService = {
  async check({ key, limit, windowSeconds }: RateLimitOptions) {
    if (!key) {
      return {
        allowed: false,
        remaining: 0,
      };
    }

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(limit - current, 0),
    };
  },
};