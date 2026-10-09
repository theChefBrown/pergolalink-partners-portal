import { getCopy } from "./locales";
import { formatPrice } from "./pricing";
import { priceIssueLabel, priceRows } from "./price-summary";
import type { ConfigLocale } from "./types";
import type { OrderPricing, SystemPrice } from "./pricing-types";

export function PricePanel({
  pricing,
  system,
  locale,
  compact = false,
}: {
  pricing: OrderPricing;
  system?: SystemPrice;
  locale: ConfigLocale;
  compact?: boolean;
}) {
  const t = getCopy(locale),
    value = system ?? pricing;
  const issues = system?.issues ?? [];
  const title = system ? t.listPrice : t.commercialSummary;
  if (value.listCents == null)
    return (
      <section
        className="ac-price-panel ac-price-unavailable"
        aria-label={title}
      >
        <span className="ac-eyebrow">{title}</span>
        <p role="status">
          {issues.length
            ? priceIssueLabel(issues[0], locale)
            : t.priceOnRequest}
        </p>
      </section>
    );
  const lines = priceRows(value, pricing, locale);
  const totalLabel =
    value.status !== "complete"
      ? t.pricePartial
      : system
        ? system.quantity === 1
          ? t.priceUnit
          : t.listPrice
        : t.priceTotal;
  return (
    <section
      className={`ac-price-panel${compact ? " ac-price-compact" : ""}`}
      aria-label={title}
    >
      <div className="ac-price-breakdown">
        <span className="ac-eyebrow">{title}</span>
        <dl>
          {lines.slice(0, -1).map(([label, amount]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{amount}</dd>
            </div>
          ))}
        </dl>
        {issues.map((issue) => (
          <p className="ac-price-note" key={issue}>
            {priceIssueLabel(issue, locale)}
          </p>
        ))}
      </div>
      <div
        className="ac-price-result"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          {pricing.discountPercent > 0 ? t.afterDiscount : totalLabel}
          {system && system.quantity > 1
            ? ` · ${system.quantity} ${t.units}`
            : ""}
        </span>
        <strong>
          {formatPrice(value.netCents!, locale, pricing.currency)}
        </strong>
        <small>
          {pricing.tax === "excluded"
            ? t.taxExcluded
            : pricing.tax === "included"
              ? t.taxIncluded
              : t.taxUnconfirmed}
          {pricing.discountPercent === 0 ? ` · ${t.beforeDiscount}` : ""}
        </small>
      </div>
      <div className="ac-price-footnote">
        <p>{t.demoPrices}</p>
        {pricing.provisional && <p>{t.provisionalPricing}</p>}
        {!pricing.currency && <p>{t.currencyUnconfirmed}</p>}
        {value.status !== "complete" && <p>{t.partialPricingHint}</p>}
        {pricing.dimensionRule !== "exact" && (
          <p>
            {pricing.dimensionRule === "ceiling"
              ? t.ceilingPricing
              : t.interpolatedPricing}
          </p>
        )}
        <p>{t.equipmentPricingHint}</p>
        {system?.lines[0]?.pricedDimensions && (
          <p>
            {t.tariffDimensions}:{" "}
            {Object.entries(system.lines[0].pricedDimensions)
              .map(
                ([axis, n]) =>
                  `${t[axis as "width" | "height" | "projection"]} ${n} mm`,
              )
              .join(" · ")}
          </p>
        )}
      </div>
    </section>
  );
}
