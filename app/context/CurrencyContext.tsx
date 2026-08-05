"use client";

import { createContext } from "react";
import type { ExchangeRates } from "@/app/libs/currency";

export type Currency = "USD" | "EUR" | "SYP";

export const currencies: Currency[] = ["USD", "EUR", "SYP"];

export const currencyLabels: Record<Currency, string> = {
  USD: "USD $",
  EUR: "EUR €",
  SYP: "SYP ل.س",
};

export type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: ExchangeRates;
  ratesLoading: boolean;
};

export const CurrencyContext =
  createContext<CurrencyContextType | null>(null);