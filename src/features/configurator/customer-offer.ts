import type { OrderPricing } from "./pricing-types";
import { priceNeedsReview } from "./price-review";

export type Adjustment = { mode: "percent" | "amount"; value: number };
export type CustomerOfferSettings = {
  markup: Adjustment;
  discount: Adjustment;
};
export type CustomerBrand = { name: string; logoDataUrl?: string };
export const defaultCustomerOffer: CustomerOfferSettings = {
  markup: { mode: "percent", value: 0 },
  discount: { mode: "percent", value: 0 },
};
export type CustomerOffer = {
  currency: string | null;
  tax: OrderPricing["tax"];
  provisional: boolean;
  partial: boolean;
  lines: {
    systemId: string;
    quantity: number;
    priceCents: number | null;
    discountCents: number | null;
    finalCents: number | null;
  }[];
  priceCents: number | null;
  discountCents: number | null;
  discountPercent: number;
  finalCents: number | null;
};

const MAX_CENTS = 1_000_000_000_000;
function percentageOf(cents: number, percent: number) {
  return Number(
    (BigInt(cents) * BigInt(Math.round(percent * 100)) + BigInt(5000)) /
      BigInt(10000),
  );
}
function validAdjustment(a: Adjustment) {
  return (
    ["percent", "amount"].includes(a.mode) &&
    Number.isFinite(a.value) &&
    a.value >= 0 &&
    a.value <= MAX_CENTS / 100 &&
    Math.abs(a.value * 100 - Math.round(a.value * 100)) < 0.00001
  );
}
/** Largest remainder allocation keeps every displayed line and total consistent to the cent. */
function allocate(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const denominator = BigInt(sum);
  const parts = weights.map((weight, index) => {
    const value = BigInt(total) * BigInt(weight);
    return {
      index,
      cents: Number(value / denominator),
      remainder: value % denominator,
    };
  });
  let remaining = total - parts.reduce((n, p) => n + p.cents, 0);
  for (const p of [...parts].sort((a, b) =>
    a.remainder === b.remainder
      ? a.index - b.index
      : a.remainder > b.remainder
        ? -1
        : 1,
  )) {
    if (remaining-- > 0) p.cents++;
  }
  return parts.map((p) => p.cents);
}

/** Builds a public DTO: no dealer discount, purchase cost, markup or Excel sources. */
export function calculateCustomerOffer(
  pricing: OrderPricing,
  settings: CustomerOfferSettings,
): CustomerOffer {
  if (
    !validAdjustment(settings.markup) ||
    !validAdjustment(settings.discount) ||
    (settings.discount.mode === "percent" && settings.discount.value > 100)
  )
    throw Error("offerAdjustmentError");
  const weights = pricing.systems.map((s) =>
    s.status === "complete" &&
    s.netCents != null &&
    !s.lines.some((line) => priceNeedsReview(line.source, line.cells))
      ? s.netCents
      : null,
  );
  if (
    weights.some(
      (v) => v != null && (!Number.isSafeInteger(v) || v < 0 || v > MAX_CENTS),
    )
  )
    throw Error("offerAdjustmentError");
  const base = weights.reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const hasPrice = weights.some((v) => v != null);
  const markup =
    settings.markup.mode === "amount"
      ? Math.round(settings.markup.value * 100)
      : percentageOf(base, settings.markup.value);
  const price = base + markup;
  if (!Number.isSafeInteger(price) || price > MAX_CENTS)
    throw Error("offerAdjustmentError");
  const discount =
    settings.discount.mode === "amount"
      ? Math.round(settings.discount.value * 100)
      : percentageOf(price, settings.discount.value);
  if (
    !Number.isSafeInteger(price) ||
    price > MAX_CENTS ||
    discount > price ||
    (!base && markup > 0)
  )
    throw Error("offerAdjustmentError");
  const pricedLines = allocate(
    price,
    weights.map((n) => n ?? 0),
  );
  const discounts = allocate(discount, pricedLines);
  return {
    currency: pricing.currency,
    tax: pricing.tax,
    provisional: !!pricing.provisional,
    partial: weights.some((v) => v == null),
    lines: pricing.systems.map((s, i) => ({
      systemId: s.systemId,
      quantity: s.quantity,
      priceCents: weights[i] == null ? null : pricedLines[i],
      discountCents: weights[i] == null ? null : discounts[i],
      finalCents: weights[i] == null ? null : pricedLines[i] - discounts[i],
    })),
    priceCents: hasPrice ? price : null,
    discountCents: hasPrice ? discount : null,
    discountPercent: price ? (discount / price) * 100 : 0,
    finalCents: hasPrice ? price - discount : null,
  };
}
