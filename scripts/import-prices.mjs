import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { unzip, numericCells, column } from "./xlsx.mjs";
const root = resolve(import.meta.dirname, ".."),
  folder = resolve(root, "docs/prices");
const catalog = JSON.parse(readFileSync(resolve(folder, "catalog.json")));
if (catalog.fictional !== true)
  throw Error("Only fictional demo catalogues are supported");
const tables = {};
for (const t of catalog.tables) {
  if (!/^demo-[a-z]+\.xlsx$/.test(t.source))
    throw Error("Invalid demo workbook name");
  const bytes = readFileSync(resolve(folder, t.source)),
    entries = unzip(bytes),
    cells = numericCells(entries[t.sheetFile]);
  for (const [index, value] of t.rows.entries())
    if (cells[`A${index + 5}`] !== value)
      throw Error(`${t.id}: row dimensions changed; update catalog.json`);
  for (const [index, value] of t.columns.entries())
    if (cells[`${column(index + 1)}4`] !== value)
      throw Error(`${t.id}: column dimensions changed; update catalog.json`);
  const cents = t.rows.map((_, r) =>
    t.columns.map((_, c) => {
      const ref = `${column(c + 1)}${r + 5}`,
        value = cells[ref];
      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        !Number.isSafeInteger(Math.round(value * 100))
      )
        throw Error(`${t.id}: invalid price in ${ref}`);
      return Math.round(value * 100);
    }),
  );
  for (let r = 0; r < cents.length; r++)
    for (let c = 0; c < cents[r].length; c++)
      if (
        (r && cents[r][c] < cents[r - 1][c]) ||
        (c && cents[r][c] < cents[r][c - 1])
      )
        throw Error(
          `${t.id}: decreasing demo tariff at ${column(c + 1)}${r + 5}`,
        );
  tables[t.id] = {
    source: t.source,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sheet: t.sheet,
    rowAxis: t.rowAxis,
    columnAxis: t.columnAxis,
    rows: t.rows,
    columns: t.columns,
    rowNumbers: t.rows.map((_, i) => i + 5),
    columnLetters: t.columns.map((_, i) => column(i + 1)),
    cents,
  };
}
const extra = numericCells(
  unzip(readFileSync(resolve(folder, "demo-extras.xlsx")))[
    "xl/worksheets/sheet1.xml"
  ],
);
const extraPostCents = Object.fromEntries(
  catalog.posts.map((p) => {
    const value = extra[`B${p.row}`];
    if (!Number.isFinite(value) || value < 0)
      throw Error("Invalid extra post price");
    return [p.id, Math.round(value * 100)];
  }),
);
writeFileSync(
  resolve(root, "src/features/configurator/price-data.ts"),
  `// GENERATED: FICTIONAL DEMO PRICES ONLY. npm run import:prices\nimport type { PriceTable } from './pricing-types';\nexport const priceTables: Record<string, PriceTable> = ${JSON.stringify(tables)};\n`,
);
writeFileSync(
  resolve(root, "src/features/configurator/demo-post-prices.ts"),
  `// GENERATED: FICTIONAL DEMO PRICES ONLY.\nexport const extraPostCents = ${JSON.stringify(extraPostCents)};\n`,
);
console.log(
  `Imported ${Object.keys(tables).length} demo tariff grids and ${catalog.posts.length} post rates.`,
);
