"use client";

import { useEffect, useMemo, useState } from "react";

import { Currency, CurrencyContext } from "../context/CurrencyContext";
import type { ExchangeRates } from "@/app/libs/currency";

const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  SYP: 15000,
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export default function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "USD";

    const saved = localStorage.getItem("via7-currency");

    if (saved === "USD" || saved === "EUR" || saved === "SYP") {
      return saved;
    }

    return "USD";
  });

  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadRates = async () => {
      try {
        const response = await fetch("/api/currency/rates");

        if (!response.ok) return;

        const data = await response.json();

        if (mounted) {
          setRates(data);
        }
      } catch {
        // fallback rates
      } finally {
        if (mounted) {
          setRatesLoading(false);
        }
      }
    };

    loadRates();

    return () => {
      mounted = false;
    };
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("via7-currency", newCurrency);
  };

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      ratesLoading,
    }),
    [currency, rates, ratesLoading]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}