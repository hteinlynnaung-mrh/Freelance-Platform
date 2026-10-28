import type { Currency } from "../api/types";

/** Money is stored in integer minor units; JPY still displays whole yen with no decimals. */
export function formatMoney(minor: number, currency: Currency, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}
