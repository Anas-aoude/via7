import { NextResponse } from "next/server";

import redis from "@/app/libs/redis";

const CACHE_KEY = "via7:currency:rates";
const CACHE_TTL_SECONDS = 60 * 60 * 6;
const FETCH_TIMEOUT_MS = 5000;

const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  SYP: 15000,
};

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      try {
        return NextResponse.json(JSON.parse(cached));
      } catch {
        await redis.del(CACHE_KEY);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(
        "https://open.er-api.com/v6/latest/USD",
        {
          signal: controller.signal,
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return NextResponse.json(FALLBACK_RATES);
      }

      const data = await response.json();

      const eurRate = Number(data?.rates?.EUR);
      const sypRate = Number(data?.rates?.SYP);

      const rates = {
        USD: 1,
        EUR:
          Number.isFinite(eurRate) && eurRate > 0
            ? eurRate
            : FALLBACK_RATES.EUR,
        SYP:
          Number.isFinite(sypRate) && sypRate > 0
            ? sypRate
            : FALLBACK_RATES.SYP,
      };

      await redis.set(
        CACHE_KEY,
        JSON.stringify(rates),
        "EX",
        CACHE_TTL_SECONDS
      );

      return NextResponse.json(rates);
    } catch (error) {
      console.log("[CURRENCY_EXTERNAL_API_ERROR]", error);

      return NextResponse.json(FALLBACK_RATES);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.log("[CURRENCY_RATES_GET]", error);

    return NextResponse.json(FALLBACK_RATES);
  }
}