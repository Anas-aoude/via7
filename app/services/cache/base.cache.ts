import { CacheService } from "./cache.service";

export class BaseCache<T = unknown> {
  constructor(
    private readonly key: string,
    private readonly ttl: number = 300
  ) { }

  async get(): Promise<T | null> {
    return CacheService.get<T>(this.key);
  }

  async set(value: T): Promise<void> {
    await CacheService.set(this.key, value, this.ttl);
  }

  async clear(): Promise<void> {
    await CacheService.del(this.key);
  }

  async exists(): Promise<boolean> {
    return CacheService.exists(this.key);
  }
}