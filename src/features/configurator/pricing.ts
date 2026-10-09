import { configurationErrors, modelFor } from "./catalog";
import { frontPostPlan } from "./layout";
import { priceTables } from "./price-data";
import { pricePolicy } from "./price-policy";
import { priceNeedsReview } from "./price-review";
import type { SystemConfiguration, ConfigLocale } from "./types";
import type {
  OrderPricing,
  PriceIssue,
  PriceLine,
  PricePolicy,
  PriceTable,
  SystemPrice,
} from "./pricing-types";

export function priceTableId(s: SystemConfiguration): string | null {
  if (modelFor(s.model).kind === "retractable") return `${s.model}-${s.mount}`;
  if (s.model === "tripleglass") return `tripleglass-${s.panels}`;
  return s.model;
}

type Lookup =
  | { line: PriceLine; issue?: never }
  | { line?: never; issue: PriceIssue };
export function lookupPrice(
  table: PriceTable,
  s: SystemConfiguration,
  rule: PricePolicy["dimensionRule"],
): Lookup {
  const a = s[table.rowAxis],
    b = s[table.columnAxis];
  if (![a, b].every((n) => Number.isFinite(n) && n > 0))
    return { issue: "invalid" };
  // No extrapolation, minimum-charge assumption or filling gaps in a source grid.
  if (
    a < table.rows[0] ||
    a > table.rows.at(-1)! ||
    b < table.columns[0] ||
    b > table.columns.at(-1)!
  )
    return { issue: "outsideTable" };
  const r = table.rows.findIndex((n) => n >= a),
    c = table.columns.findIndex((n) => n >= b);
  if (rule === "exact" && (table.rows[r] !== a || table.columns[c] !== b))
    return { issue: "betweenSteps" };
  const r0 = rule === "interpolate" && table.rows[r] !== a ? r - 1 : r;
  const c0 = rule === "interpolate" && table.columns[c] !== b ? c - 1 : c;
  const refs = [
    ...new Set([
      `${table.columnLetters[c0]}${table.rowNumbers[r0]}`,
      `${table.columnLetters[c]}${table.rowNumbers[r0]}`,
      `${table.columnLetters[c0]}${table.rowNumbers[r]}`,
      `${table.columnLetters[c]}${table.rowNumbers[r]}`,
    ]),
  ];
  const values = [
    table.cents[r0]?.[c0],
    table.cents[r0]?.[c],
    table.cents[r]?.[c0],
    table.cents[r]?.[c],
  ];
  if (priceNeedsReview(table.source, refs)) return { issue: "sourceReview" };
  if (values.some((n) => n == null || !Number.isSafeInteger(n) || n <= 0))
    return { issue: "emptyCell" };
  const [v00, v01, v10, v11] = values as number[];
  const x =
    r0 === r ? 0 : (a - table.rows[r0]) / (table.rows[r] - table.rows[r0]);
  const z =
    c0 === c
      ? 0
      : (b - table.columns[c0]) / (table.columns[c] - table.columns[c0]);
  const cents = Math.round(
    (v00 * (1 - z) + v01 * z) * (1 - x) + (v10 * (1 - z) + v11 * z) * x,
  );
  return {
    line: {
      kind: "base",
      count: 1,
      unitCents: cents,
      totalCents: cents,
      source: table.source,
      sourceHash: table.sha256,
      cells: refs,
      pricedDimensions: {
        [table.rowAxis]: rule === "interpolate" ? a : table.rows[r],
        [table.columnAxis]: rule === "interpolate" ? b : table.columns[c],
      },
    },
  };
}

export function normalizeDiscount(percent = 0) {
  return Number.isFinite(percent)
    ? Math.round(Math.min(100, Math.max(0, percent)) * 100) / 100
    : 0;
}

export function priceSystem(
  s: SystemConfiguration,
  discountPercent = 0,
  policy: PricePolicy = pricePolicy,
): SystemPrice {
  const lines: PriceLine[] = [],
    issues: PriceIssue[] = [];
  const tableId = priceTableId(s),
    table = tableId ? priceTables[tableId] : undefined;
  if (configurationErrors(s).length) issues.push("invalid");
  else if (!table) issues.push(tableId ? "mountUnavailable" : "unavailable");
  else {
    const lookup = lookupPrice(table, s, policy.dimensionRule);
    if (lookup.issue) issues.push(lookup.issue);
    else if (lookup.line) lines.push(lookup.line);
  }
  // Without a base price, never present accessories as a system price.
  if (lines.length) {
    const posts = frontPostPlan(s).extra.length;
    if (posts) {
      const tariff = policy.extraPostCents[s.model];
      const valid =
        tariff != null && Number.isSafeInteger(tariff) && tariff >= 0;
      lines.push({
        kind: "posts",
        count: posts,
        unitCents: valid ? tariff : null,
        totalCents: valid ? posts * tariff : null,
      });
      if (!valid) issues.push("postsPending");
    }
    if (s.lighting) {
      const lookup = policy.ledModels.includes(s.model)
        ? lookupPrice(priceTables.led, s, policy.dimensionRule)
        : null;
      if (lookup?.line) lines.push({ ...lookup.line, kind: "led" });
      else {
        lines.push({
          kind: "led",
          count: 1,
          unitCents: null,
          totalCents: null,
        });
        issues.push("ledPending");
        if (lookup?.issue === "sourceReview") issues.push("sourceReview");
      }
    }
    // All glass and finish choices are included in the fictional demo base tariff.
  }
  const unitListCents = lines.length
    ? lines.reduce((sum, line) => sum + (line.totalCents ?? 0), 0)
    : null;
  const listCents = unitListCents == null ? null : unitListCents * s.quantity;
  const discountCents =
    listCents == null
      ? null
      : Math.round((listCents * normalizeDiscount(discountPercent)) / 100);
  return {
    systemId: s.id,
    quantity: s.quantity,
    lines,
    issues,
    status:
      listCents == null
        ? "unavailable"
        : issues.length
          ? "partial"
          : "complete",
    unitListCents,
    listCents,
    discountCents,
    netCents: listCents == null ? null : listCents - discountCents!,
  };
}

export function priceOrder(
  systems: SystemConfiguration[],
  discountPercent = 0,
  dealer?: OrderPricing["dealer"],
  policy: PricePolicy = pricePolicy,
): OrderPricing {
  const discount = normalizeDiscount(discountPercent);
  const prices = systems.map((s) => priceSystem(s, discount, policy));
  const sum = (key: "listCents" | "discountCents" | "netCents") =>
    prices.some((p) => p[key] != null)
      ? prices.reduce((n, p) => n + (p[key] ?? 0), 0)
      : null;
  return {
    version: 1,
    provisional: policy.provisional,
    policyVersion: policy.version,
    currency: policy.currency,
    tax: policy.tax,
    dimensionRule: policy.dimensionRule,
    discountPercent: discount,
    dealer,
    systems: prices,
    status:
      !prices.length || prices.every((p) => p.status === "unavailable")
        ? "unavailable"
        : prices.some((p) => p.status !== "complete")
          ? "partial"
          : "complete",
    listCents: sum("listCents"),
    discountCents: sum("discountCents"),
    netCents: sum("netCents"),
  };
}

export function formatPrice(
  cents: number,
  locale: ConfigLocale,
  currency: string | null,
) {
  return new Intl.NumberFormat(locale, {
    ...(currency ? { style: "currency", currency } : {}),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
