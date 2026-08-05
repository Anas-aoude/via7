import redis from "@/app/libs/redis";

import type { RateLimitConfig, RateLimitResult } from "./rate-limit.types";

const buildKey = (key: string) => `rate-limit:${key}`;

export const RateLimitService = {
  async check({
    key,
    limit,
    windowSeconds,
  }: RateLimitConfig): Promise<RateLimitResult> {
    const redisKey = buildKey(key);

    const current = await redis.incr(redisKey);

    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    const ttl = await redis.ttl(redisKey);

    return {
      success: current <= limit,
      limit,
      remaining: Math.max(limit - current, 0),
      resetInSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  },

  async login(identifier: string) {
    return this.check({
      key: `login:${identifier}`,
      limit: 10,
      windowSeconds: 60 * 15,
    });
  },

  async register(identifier: string) {
    return this.check({
      key: `register:${identifier}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });
  },

  async messages(identifier: string) {
    return this.check({
      key: `messages:${identifier}`,
      limit: 30,
      windowSeconds: 60,
    });
  },

  async reviews(identifier: string) {
    return this.check({
      key: `reviews:${identifier}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });
  },

  async listings(identifier: string) {
    return this.check({
      key: `listings:${identifier}`,
      limit: 20,
      windowSeconds: 60 * 60,
    });
  },

  async uploads(identifier: string) {
    return this.check({
      key: `uploads:${identifier}`,
      limit: 30,
      windowSeconds: 60 * 60,
    });
  },
};