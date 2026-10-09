import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { workbook } from "./xlsx.mjs";
// These coefficients are invented for this public demo. No commercial workbook is read.
const systems = [
  ["eira", "width", "projection", 3200, 6065, 420, 95],
  ["aeris", "width", "projection", 4000, 6970, 460, 105],
  ["liniar", "width", "projection", 4000, 6970, 500, 115],
  ["imperium", "width", "projection", 11000, 7000, 300, 65],
  ["arcodia", "width", "projection", 11000, 11000, 340, 75],
  ["majestic", "width", "projection", 11000, 11000, 380, 85],
  ["runglass", "height", "width", 3000, 30000, 120, 40],
  ["thermoglass", "height", "width", 3000, 30000, 180, 55],
  ["tripleglass", "height", "width", 3000, 3800, 260, 70],
  ["wintergarden", "width", "projection", 10000, 4000, 360, 90],
  ["screenzip", "height", "width", 3000, 4000, 90, 30],
  ["skyzip", "width", "projection", 6000, 4000, 150, 45],
  ["led", "width", "projection", 30000, 11000, 35, 5],
];
const root = resolve(import.meta.dirname, ".."),
  folder = resolve(root, "docs/prices");
mkdirSync(folder, { recursive: true });
const axis = (max) =>
  [
    ...new Set([
      1,
      ...Array.from({ length: Math.floor(max / 500) }, (_, i) => (i + 1) * 500),
      max,
    ]),
  ].sort((a, b) => a - b);
const manifest = [];
for (const [
  model,
  rowAxis,
  columnAxis,
  maxRow,
  maxColumn,
  base,
  rate,
] of systems) {
  const variants = ["imperium", "arcodia", "majestic"].includes(model)
    ? [
        ["wall", 1],
        ["freestanding", 1.25],
        ["existing", 0.8],
        ["rods", 1.1],
        ["double", 1.8],
      ]
    : model === "tripleglass"
      ? [
          ["2", 1],
          ["3", 1.2],
        ]
      : [["base", 1]];
  const rows = axis(maxRow),
    columns = axis(maxColumn),
    source = `demo-${model}.xlsx`;
  const sheets = variants.map(([variant, factor], i) => {
    const id = variant === "base" ? model : `${model}-${variant}`;
    manifest.push({
      id,
      source,
      sheet: variant,
      sheetFile: `xl/worksheets/sheet${i + 1}.xml`,
      rowAxis,
      columnAxis,
      rows,
      columns,
      base,
      rate,
      factor,
    });
    return {
      name: variant,
      rows: [
        ["DUMMY PRICES - FICTIONAL - NOT A COMMERCIAL OFFER"],
        [model, variant, "EUR, simulated VAT excluded"],
        [`Rows: ${rowAxis} mm / columns: ${columnAxis} mm`],
        [rowAxis + " / " + columnAxis, ...columns],
        ...rows.map((a) => [
          a,
          ...columns.map(
            (b) =>
              Math.round(
                (base + ((a * b) / 1e6) * rate + ((a + b) / 1000) * 9) *
                  factor *
                  100,
              ) / 100,
          ),
        ]),
      ],
    };
  });
  writeFileSync(resolve(folder, source), workbook(sheets));
}
const posts = [
  "eira",
  "aeris",
  "liniar",
  "imperium",
  "arcodia",
  "majestic",
  "wintergarden",
].map((id, i) => ({ id, euros: 40 + i * 5, row: i + 5 }));
writeFileSync(
  resolve(folder, "demo-extras.xlsx"),
  workbook([
    {
      name: "posts",
      rows: [
        ["DUMMY PRICES - FICTIONAL"],
        ["Extra posts", "EUR / piece"],
        ["All finish and glass choices included in the synthetic base price"],
        ["Model", "Unit price"],
        ...posts.map((p) => [p.id, p.euros]),
      ],
    },
  ]),
);
writeFileSync(
  resolve(folder, "catalog.json"),
  JSON.stringify(
    {
      fictional: true,
      currency: "EUR",
      formula:
        "round((base + area_m2 * rate + (row_m + column_m) * 9) * variantFactor, 2)",
      tables: manifest,
      posts,
    },
    null,
    2,
  ) + "\n",
);
await import("./import-prices.mjs");
console.log(
  "Generated 14 entirely synthetic Excel workbooks, including all 12 systems.",
);
