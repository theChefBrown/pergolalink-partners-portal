import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  skipped = new Set(["node_modules", ".next", ".git", "artifacts"]);
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    skipped.has(e.name)
      ? []
      : e.isDirectory()
        ? files(join(dir, e.name))
        : [join(dir, e.name)],
  );
}
const problems = [];
const catalog = JSON.parse(readFileSync(join(root, "docs/prices/catalog.json")));
const workbooks = new Set(["docs/prices/demo-extras.xlsx", ...catalog.tables.map((t) => "docs/prices/" + t.source)]);
for (const path of files(root)) {
  const name = relative(root, path).replaceAll("\\", "/");
  if (name.endsWith(".xlsx") && !workbooks.has(name)) problems.push(name);
  if (name.endsWith(".pdf") && name !== "public/demo/sample.pdf") problems.push(name);
  if (/^\.env(?!\.example$)/.test(name) || /\.(pem|p12|pfx|key)$/i.test(name))
    problems.push(name);
  if (
    !/\.(tsx?|mjs|json|md|css|yml|svg)$/.test(name) ||
    name === "scripts/check-public.mjs"
  )
    continue;
  const content = readFileSync(path, "utf8");
  if (
    /C:[\\/]+Users[\\/]|(?:sk|ghp|github_pat)[-_][A-Za-z0-9]{24,}|BEGIN (?:RSA )?PRIVATE KEY|pret_dealer\.xlsx/i.test(
      content,
    )
  )
    problems.push(name);
}
if (
  catalog.fictional !== true ||
  new Set(catalog.tables.map((t) => t.source)).size !== 13
)
  problems.push("demo price coverage");
if (problems.length)
  throw Error("Public copy check failed: " + problems.join(", "));
console.log(
  "PASS: public source tree has fictional workbook coverage and no environment files, private keys or workstation paths.",
);
