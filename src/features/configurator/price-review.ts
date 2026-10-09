import { auditPriceTables } from "./price-audit";
import { priceTables } from "./price-data";

const blocked = new Set(
  auditPriceTables(priceTables).map((a) => `${a.source}:${a.cell}`),
);
export function priceNeedsReview(source?: string, cells: string[] = []) {
  return !!source && cells.some((cell) => blocked.has(`${source}:${cell}`));
}
