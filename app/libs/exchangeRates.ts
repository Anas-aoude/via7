import redis from "@/app/libs/redis";
import type { ExchangeRates } from "@/app/libs/currency";

const CACHE_KEY = "via7:currency:rates";

export const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  SYP: 15000,
};

export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const cached = await redis.get(CACHE_KEY);

    if (!cached) {
      return FALLBACK_RATES;
    }

    return JSON.parse(cached) as ExchangeRates;
  } catch (error) {
    console.log("[GET_EXCHANGE_RATES]", error);
    return FALLBACK_RATES;
  }
}