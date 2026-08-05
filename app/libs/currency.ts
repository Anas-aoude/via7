export type Currency = "USD" | "EUR" | "SYP";

export interface ExchangeRates {
  USD: number;
  EUR: number;
  SYP: number;
}

export function convertPrice(
  amount: number,
  currency: Currency,
  rates: ExchangeRates
) {
  switch (currency) {
    case "EUR":
      return amount * rates.EUR;

    case "SYP":
      return amount * rates.SYP;

    default:
      return amount;
  }
}

export function formatPrice(
  amount: number,
  currency: Currency,
  rates: ExchangeRates
) {
  const converted = convertPrice(amount, currency, rates);

  switch (currency) {
    case "EUR":
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(converted);

    case "SYP":
      return (
        new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(converted) + " ل.س"
      );

    default:
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(converted);
  }
}

export function convertToUsd(
  amount: number,
  currency: Currency,
  rates: ExchangeRates
) {
  switch (currency) {
    case "EUR":
      return amount / rates.EUR;

    case "SYP":
      return amount / rates.SYP;

    default:
      return amount;
  }
}