import { getCopy } from "./locales";
import { formatPrice } from "./pricing";
import type { ConfigLocale } from "./types";
import type { OrderPricing, PriceIssue, SystemPrice } from "./pricing-types";

export function priceIssueLabel(issue: PriceIssue, locale: ConfigLocale) {
  const t = getCopy(locale);
  return {
    sourceReview: t.priceSourceReview,
    unavailable: t.priceOnRequest,
    mountUnavailable: t.priceMount,
    outsideTable: t.priceOutside,
    emptyCell: t.priceOutside,
    betweenSteps: t.priceBetween,
    postsPending: t.pricePostsPending,
    ledPending: t.priceLedPending,
    glassPending: t.priceGlassPending,
    invalid: t.invalidConfiguration,
  }[issue];
}

export function priceRows(
  price: SystemPrice | OrderPricing,
  pricing: OrderPricing,
  locale: ConfigLocale,
): [string, string][] {
  const t = getCopy(locale);
  const money = (n: number | null) =>
    n == null ? t.pricePending : formatPrice(n, locale, pricing.currency);
  const rows: [string, string][] = [];
  if ("lines" in price) {
    for (const line of price.lines)
      rows.push([
        { base: t.basePrice, posts: t.intermediatePosts, led: t.lighting }[
          line.kind
        ] + (line.count > 1 ? ` × ${line.count}` : ""),
        money(line.totalCents),
      ]);
    if (price.quantity > 1 && price.unitListCents != null)
      rows.push([
        `${t.quantity} × ${t.priceUnit}`,
        `${price.quantity} × ${money(price.unitListCents)}`,
      ]);
  }
  if (price.listCents != null) {
    rows.push([
      price.status === "complete" ? t.listPrice : t.pricePartial,
      money(price.listCents),
    ]);
    rows.push([
      `${t.dealerDiscount} · ${new Intl.NumberFormat(locale).format(pricing.discountPercent)}%`,
      money(price.discountCents),
    ]);
    rows.push([t.afterDiscount, money(price.netCents)]);
  }
  return rows;
}
