import type { ModelId } from "./types";

export type PriceAxis = "width" | "projection" | "height";
export type PriceTable = {
  source: string;
  sha256: string;
  sheet: string;
  rowAxis: PriceAxis;
  columnAxis: PriceAxis;
  rows: number[];
  columns: number[];
  rowNumbers: number[];
  columnLetters: string[];
  cents: (number | null)[][];
};
export type PricePolicy = {
  provisional?: boolean;
  version: string;
  currency: string | null;
  tax: "excluded" | "included" | "unconfirmed";
  dimensionRule: "ceiling" | "interpolate" | "exact";
  /** Null means a commercial rule still needs confirmation. Never assume zero. */
  extraPostCents: Partial<Record<ModelId, number | null>>;
  ledModels: ModelId[];
};
export type PriceIssue =
  | "sourceReview"
  | "unavailable"
  | "mountUnavailable"
  | "outsideTable"
  | "emptyCell"
  | "betweenSteps"
  | "postsPending"
  | "ledPending"
  | "glassPending"
  | "invalid";
export type PriceLine = {
  kind: "base" | "posts" | "led";
  count: number;
  unitCents: number | null;
  totalCents: number | null;
  source?: string;
  sourceHash?: string;
  cells?: string[];
  pricedDimensions?: Partial<Record<PriceAxis, number>>;
};
export type SystemPrice = {
  systemId: string;
  quantity: number;
  lines: PriceLine[];
  issues: PriceIssue[];
  status: "complete" | "partial" | "unavailable";
  unitListCents: number | null;
  listCents: number | null;
  discountCents: number | null;
  netCents: number | null;
};
export type OrderPricing = {
  provisional?: boolean;
  version: 1;
  policyVersion: string;
  currency: string | null;
  tax: PricePolicy["tax"];
  dimensionRule: PricePolicy["dimensionRule"];
  discountPercent: number;
  dealer?: { id: string; name: string };
  systems: SystemPrice[];
  status: SystemPrice["status"];
  listCents: number | null;
  discountCents: number | null;
  netCents: number | null;
};
