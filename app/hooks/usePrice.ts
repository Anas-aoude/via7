"use client";

import useCurrency from "@/app/hooks/useCurrency";
import { convertPrice, formatPrice } from "@/app/libs/currency";

export default function usePrice(amount: number) {
  const { currency, rates, ratesLoading } = useCurrency();

  const value = convertPrice(amount, currency, rates);
  const formatted = formatPrice(amount, currency, rates);

  return {
    currency,
    value,
    formatted,
    loading: ratesLoading,
  };
}