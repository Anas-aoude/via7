export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
};

export type RateLimitConfig = {
  key: string;
  limit: number;
  windowSeconds: number;
};