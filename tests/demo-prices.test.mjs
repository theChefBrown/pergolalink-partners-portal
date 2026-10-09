import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import "./resolve-configurator.mjs";
import { priceTables } from "../src/features/configurator/price-data.ts";
import {
  models,
  createSystem,
  mountsFor,
  isPergola,
  patchSystem,
} from "../src/features/configurator/catalog.ts";
import {
  priceSystem,
  priceOrder,
} from "../src/features/configurator/pricing.ts";
import { calculateCustomerOffer } from "../src/features/configurator/customer-offer.ts";
import { auditPriceTables } from "../src/features/configurator/price-audit.ts";
import { initialDemoState } from "../src/lib/mock-data/platform.ts";
import { unzip, numericCells } from "../scripts/xlsx.mjs";
const folder = new URL("../docs/prices/", import.meta.url);

test("all 14 workbooks are valid XLSX with synthetic prices matching all 26 imported grids", () => {
  assert.equal(
    readdirSync(folder).filter((n) => n.endsWith(".xlsx")).length,
    14,
  );
  assert.equal(Object.keys(priceTables).length, 26);
  const manifest = JSON.parse(readFileSync(new URL("catalog.json", folder)));
  for (const entry of manifest.tables) {
    const t = priceTables[entry.id],
      bytes = readFileSync(new URL(entry.source, folder)),
      parts = unzip(bytes),
      cells = numericCells(parts[entry.sheetFile]);
    assert.match(parts[entry.sheetFile], /DUMMY PRICES/);
    assert.equal(t.sha256, createHash("sha256").update(bytes).digest("hex"));
    for (let r = 0; r < t.rows.length; r++)
      for (let c = 0; c < t.columns.length; c++) {
        assert.equal(
          t.cents[r][c],
          Math.round(cells[`${t.columnLetters[c]}${t.rowNumbers[r]}`] * 100),
        );
        const synthetic = Math.round(
          (entry.base +
            ((t.rows[r] * t.columns[c]) / 1e6) * entry.rate +
            ((t.rows[r] + t.columns[c]) / 1000) * 9) *
            entry.factor *
            100,
        );
        assert.equal(t.cents[r][c], synthetic);
      }
  }
  assert.deepEqual(auditPriceTables(priceTables), []);
});

test("every model and permitted mounting variant has a complete dynamic demo price", () => {
  for (const m of models)
    for (const mount of isPergola(m.id) ? mountsFor(m.id) : ["freestanding"]) {
      const s = patchSystem(createSystem(m.id), { mount });
      const price = priceSystem(s, 10);
      assert.equal(
        price.status,
        "complete",
        `${m.id}/${mount}: ${price.issues}`,
      );
      assert.ok(price.netCents > 0);
      const wider = patchSystem(s, { width: s.width - 500 });
      assert.ok(priceSystem(wider).listCents < priceSystem(s).listCents, m.id);
      if (isPergola(m.id)) {
        const equipped = patchSystem(s, {
          intermediatePosts: 1,
          lighting: true,
        });
        const extra = priceSystem(equipped);
        assert.equal(extra.status, "complete", `${m.id}/${mount} accessories`);
        assert.ok(extra.listCents > priceSystem(s).listCents);
      }
    }
});

test("five fictional dealers have independent seeded orders, offers and contacts", () => {
  assert.equal(initialDemoState.dealers.length, 5);
  const ids = new Set(initialDemoState.dealers.map((d) => d.id));
  for (const d of initialDemoState.dealers) {
    assert.match(d.name, /Demo/);
    assert.match(d.email, /\.example$/);
    assert.equal(
      initialDemoState.orders.filter((o) => o.dealerId === d.id).length,
      3,
    );
    assert.ok(
      initialDemoState.users.some((u) => u.dealerId === d.id && u.active),
    );
  }
  assert.ok(
    initialDemoState.orders.every(
      (o) => ids.has(o.dealerId) && o.pricing.status === "complete",
    ),
  );
  assert.ok(
    initialDemoState.offers.every((o) =>
      initialDemoState.orders.some((r) => r.id === o.orderId),
    ),
  );
});

test("bulk quantity, dealer discount, extra posts and client adjustments remain independent", () => {
  const s = patchSystem(createSystem("imperium"), {
    quantity: 2,
    intermediatePosts: 2,
    lighting: true,
  });
  const pricing = priceOrder([s], 10),
    original = JSON.stringify(pricing);
  assert.equal(
    pricing.netCents,
    pricing.listCents - Math.round(pricing.listCents * 0.1),
  );
  const offer = calculateCustomerOffer(pricing, {
    markup: { mode: "amount", value: 100 },
    discount: { mode: "percent", value: 5 },
  });
  assert.equal(offer.priceCents, pricing.netCents + 10000);
  assert.equal(
    offer.finalCents,
    offer.priceCents - Math.round(offer.priceCents * 0.05),
  );
  assert.equal(JSON.stringify(pricing), original);
  assert.throws(() =>
    calculateCustomerOffer(pricing, {
      markup: { mode: "percent", value: 0 },
      discount: { mode: "percent", value: 101 },
    }),
  );
});
