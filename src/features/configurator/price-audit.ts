import type { PriceTable } from "./pricing-types";

export type PriceAnomaly = {
  table: string;
  source: string;
  cell: string;
  cents: number;
  comparisons: { cell: string; cents: number; axis: string }[];
};

/** A larger size must not silently use a lower tariff. Flag, never invent a replacement. */
export function auditPriceTables(
  tables: Record<string, PriceTable>,
): PriceAnomaly[] {
  const anomalies: PriceAnomaly[] = [];
  for (const [id, table] of Object.entries(tables)) {
    table.cents.forEach((row, r) =>
      row.forEach((value, c) => {
        if (value == null) return;
        const comparisons: PriceAnomaly["comparisons"] = [];
        for (const axis of ["row", "column"] as const) {
          let maximum = value,
            previous = "";
          for (let i = 0; i < (axis === "row" ? c : r); i++) {
            const rr = axis === "row" ? r : i,
              cc = axis === "row" ? i : c;
            const other = table.cents[rr][cc];
            if (other != null && other > maximum) {
              maximum = other;
              previous = `${table.columnLetters[cc]}${table.rowNumbers[rr]}`;
            }
          }
          if (previous)
            comparisons.push({
              cell: previous,
              cents: maximum,
              axis: axis === "row" ? table.columnAxis : table.rowAxis,
            });
        }
        if (comparisons.length)
          anomalies.push({
            table: id,
            source: table.source,
            cell: `${table.columnLetters[c]}${table.rowNumbers[r]}`,
            cents: value,
            comparisons,
          });
      }),
    );
  }
  return anomalies;
}
