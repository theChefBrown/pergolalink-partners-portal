import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BIO_BEAM_HEIGHT,
  frontPostPlan,
  systemLayout,
} from "../src/features/configurator/layout.ts";
import "./resolve-configurator.mjs";
const {
  createSystem,
  configurationErrors,
  patchSystem,
  eiraSlats,
  aerisSlats,
  models,
  MAX_ATTACHMENT_BYTES,
  attachmentBytes,
} = await import("../src/features/configurator/catalog.ts");
import {
  getCopy,
  configLocales,
} from "../src/features/configurator/locales.ts";

test("all twelve supported models start with a valid independent configuration", () => {
  assert.equal(models.length, 12);
  assert.ok(!models.some((m) => /montis|supreme/i.test(m.id)));
  for (const m of models)
    assert.deepEqual(configurationErrors(createSystem(m.id)), [], m.id);
  const first = createSystem("aeris"),
    second = createSystem("aeris");
  const changed = patchSystem(first, { width: 2500 });
  assert.notEqual(first.id, second.id);
  assert.equal(second.width, 4000);
  assert.equal(changed.width, 2500);
});
test("manufacturer limits and exact slat tables are enforced", () => {
  assert.equal(eiraSlats.at(-1).projection, 6065);
  assert.equal(aerisSlats.at(-1).projection, 6970);
  assert.equal(aerisSlats.find((r) => r.count === 5).projection, 1410);
  assert.equal(aerisSlats.find((r) => r.count === 6).projection, 1640);
  assert.ok(!eiraSlats.some((r) => r.count === 9));
  assert.ok(
    configurationErrors({ ...createSystem("eira"), width: 3201 }).includes(
      "width",
    ),
  );
  assert.ok(
    configurationErrors({
      ...createSystem("imperium"),
      projection: 7001,
    }).includes("projection"),
  );
  assert.ok(
    configurationErrors({ ...createSystem("aeris"), slats: 16 }).includes(
      "slats",
    ),
  );
  assert.ok(
    configurationErrors({ ...createSystem("screenzip"), height: NaN }).includes(
      "height",
    ),
  );
});
test("sliding glass uses the corrected choices and valid stacking", () => {
  for (const glass of ["clear", "brown", "grey", "stopsoll"])
    assert.deepEqual(
      configurationErrors({ ...createSystem("runglass"), glass }),
      [],
    );
  assert.ok(
    configurationErrors({ ...createSystem("runglass"), glass: "lowe" }).length,
  );
  const thermo = patchSystem(createSystem("thermoglass"), { panels: 6 });
  assert.equal(thermo.opening, "center");
  assert.equal(thermo.tracks, 4);
  assert.deepEqual(configurationErrors(thermo), []);
  assert.ok(
    configurationErrors({ ...thermo, opening: "right" }).includes("opening"),
  );
});
test("236 source colours exclude unavailable Prisma codes", () => {
  const colours = JSON.parse(
    fs.readFileSync(
      new URL("../src/features/configurator/colours.json", import.meta.url),
    ),
  );
  assert.equal(colours.length, 236);
  assert.equal(
    colours.filter((c) => c.collection === "RAL Classic").length,
    188,
  );
  assert.equal(new Set(colours.map((c) => c.id)).size, 236);
  assert.ok(colours.every((c) => /^#[a-f0-9]{6}$/.test(c.hex)));
  assert.ok(!colours.some((c) => ["NEOKEM 601", "NEOKEM 818"].includes(c.id)));
});
test("every UI key has a nonempty translation in all seven languages", () => {
  const expected = Object.keys(getCopy("ro")).sort();
  assert.equal(configLocales[0], "ro");
  assert.equal(configLocales.length, 7);
  for (const locale of configLocales) {
    const copy = getCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), expected);
    assert.ok(
      Object.values(copy).every(
        (s) => typeof s === "string" && s.trim().length,
      ),
    );
  }
});
test("Romanian localities have unique SIRUTA IDs and remain in their county", () => {
  const counties = JSON.parse(
    fs.readFileSync(
      new URL("../src/features/configurator/counties.json", import.meta.url),
    ),
  );
  assert.equal(counties.length, 42);
  const ids = new Set();
  let count = 0;
  for (const c of counties) {
    const locations = JSON.parse(
      fs.readFileSync(
        new URL(
          `../public/configurator/localities/${c.id}.json`,
          import.meta.url,
        ),
      ),
    );
    assert.ok(locations.length);
    for (const l of locations) {
      assert.ok(l.id && l.name);
      assert.ok(!ids.has(l.id));
      ids.add(l.id);
      count++;
    }
    if (c.name === "Brașov") {
      assert.ok(locations.some((l) => l.name === "Brașov"));
      assert.ok(!locations.some((l) => /București|Sectorul/i.test(l.name)));
    }
    if (c.name === "București")
      assert.ok(!locations.some((l) => l.name === "Brașov"));
  }
  assert.equal(count, 13755);
});
test("20 MB applies to the combined order attachments", () => {
  assert.equal(MAX_ATTACHMENT_BYTES, 20971520);
  assert.ok(
    attachmentBytes([{ size: 12 * 1024 * 1024 }, { size: 9 * 1024 * 1024 }]) >
      MAX_ATTACHMENT_BYTES,
  );
  assert.equal(
    attachmentBytes([{ size: 10 * 1024 * 1024 }, { size: 10 * 1024 * 1024 }]),
    MAX_ATTACHMENT_BYTES,
  );
});

test("an optional post adds one distinct front support across pergolas and mount types", () => {
  for (const model of [
    "aeris",
    "eira",
    "liniar",
    "imperium",
    "arcodia",
    "majestic",
    "wintergarden",
  ]) {
    for (const mount of [
      "freestanding",
      "wall",
      "existing",
      "rods",
      "double",
    ]) {
      for (const width of [3000, 8000, 11000]) {
        const s = { ...createSystem(model), mount, width };
        const before = systemLayout(s),
          after = systemLayout({ ...s, intermediatePosts: 1 });
        assert.equal(after.posts.length, before.posts.length + 1);
        assert.equal(
          new Set(after.posts.map((p) => `${p.x}:${p.z}`)).size,
          after.posts.length,
        );
        const extra = after.posts.find((p) => p.extra);
        assert.equal(extra.z, after.depth);
        assert.ok(extra.x > 0 && extra.x < width);
        assert.ok(extra.height > 0 && extra.height <= s.height);
      }
    }
  }
  assert.equal(
    systemLayout({ ...createSystem("runglass"), intermediatePosts: 1 }).posts
      .length,
    0,
  );
});

test("Wintergarden spot lights follow glass profiles and slope as dimensions change", () => {
  const s = createSystem("wintergarden");
  assert.equal(systemLayout(s).lights.length, 0);
  for (const width of [500, 4000, 10000]) {
    const layout = systemLayout({
      ...s,
      width,
      lighting: true,
      projection: 4000,
      postHeight: 2300,
    });
    assert.ok(layout.lights.length > 0);
    for (const spot of layout.lights) {
      assert.ok(
        spot.x >= 0 && spot.x <= width && spot.z > 0 && spot.z < layout.depth,
      );
      assert.ok(
        Math.abs(
          spot.x / (width / layout.glassBays) -
            Math.round(spot.x / (width / layout.glassBays)),
        ) < 0.00001,
      );
      assert.equal(spot.y, layout.roofHeight(spot.z) - 60);
    }
  }
  assert.equal(
    systemLayout({ ...createSystem("aeris"), lighting: true }).lights.length,
    0,
  );
});

test("Double drawing footprint and roof levels match both slopes", () => {
  const s = {
    ...createSystem("imperium"),
    mount: "double",
    projection: 4000,
    intermediatePosts: 1,
  };
  const layout = systemLayout(s);
  assert.equal(layout.depth, 8000);
  assert.equal(layout.roofHeight(0), s.postHeight);
  assert.equal(layout.roofHeight(layout.depth), s.postHeight);
  assert.equal(layout.roofHeight(layout.depth / 2), s.height - 100);
});

test("all pergolas and Wintergarden enforce 3000 mm including direct configuration validation", () => {
  for (const model of models.filter((m) =>
    ["bioclimatic", "retractable", "wintergarden"].includes(m.kind),
  )) {
    const s = createSystem(model.id);
    assert.equal(model.height, 3000);
    assert.ok(configurationErrors({ ...s, height: 3001 }).includes("height"));
    const max = patchSystem(s, { height: 5000 });
    assert.equal(max.height, 3000);
    assert.deepEqual(configurationErrors(max), []);
  }
});

test("bioclimatic heights remain connected without stretching the beam", () => {
  for (const model of ["eira", "aeris", "liniar"]) {
    for (const height of [1000, 2000, 2600, 3000]) {
      const s = patchSystem(createSystem(model), { height });
      const l = systemLayout(s);
      assert.equal(s.height - s.postHeight, BIO_BEAM_HEIGHT);
      for (const p of l.posts) {
        assert.equal(p.height, height - BIO_BEAM_HEIGHT);
        assert.equal(p.height, l.roofHeight(p.z) - BIO_BEAM_HEIGHT / 2);
      }
      assert.deepEqual(configurationErrors(s), []);
    }
    const fromPosts = patchSystem(createSystem(model), { postHeight: 2900 });
    assert.equal(fromPosts.height, 3000);
    assert.equal(fromPosts.postHeight, 2800);
  }
});

test("5000 mm retractable permits exactly 3 included plus 7 extra front posts", () => {
  const s = patchSystem(createSystem("imperium"), {
    width: 5000,
    intermediatePosts: 99,
  });
  const plan = frontPostPlan(s);
  assert.equal(plan.included.length, 3);
  assert.equal(plan.maxExtra, 7);
  assert.equal(s.intermediatePosts, 7);
  assert.equal(plan.positions.length, 10);
  assert.equal(new Set(plan.positions).size, 10);
  assert.ok(
    configurationErrors({ ...s, intermediatePosts: 8 }).includes(
      "intermediatePosts",
    ),
  );
  assert.ok(
    configurationErrors({ ...s, intermediatePosts: -1 }).includes(
      "intermediatePosts",
    ),
  );
  assert.ok(
    configurationErrors({ ...s, intermediatePosts: 1.5 }).includes(
      "intermediatePosts",
    ),
  );
  const narrower = patchSystem(s, { width: 2000 });
  assert.equal(narrower.intermediatePosts, 2);
  assert.equal(frontPostPlan(narrower).positions.length, 4);
});

test("post spacing never falls below 500 mm when adding posts or changing width and mount", () => {
  for (const model of ["aeris", "imperium", "wintergarden"]) {
    for (const mount of [
      "wall",
      "freestanding",
      "double",
      "existing",
      "rods",
    ]) {
      for (let width = 1000; width <= 11000; width += 137) {
        for (const count of [0, 1, 2, 7, 30]) {
          const s = patchSystem(createSystem(model), {
            width,
            mount,
            intermediatePosts: count,
          });
          const plan = frontPostPlan(s),
            positions = [0, ...plan.extra, ...plan.included, width];
          const sorted = [...new Set(positions)].sort((a, b) => a - b);
          for (let i = 1; i < sorted.length; i++)
            assert.ok(
              sorted[i] - sorted[i - 1] >= 500 - 1e-8,
              JSON.stringify({ model, mount, width, count, sorted }),
            );
          assert.ok(plan.positions.length <= Math.floor(width / 500));
          const actual = systemLayout(s).posts.filter(
            (p) => p.z === systemLayout(s).depth,
          );
          assert.equal(actual.length, plan.positions.length);
        }
      }
    }
  }
});

test("legacy single-post drafts migrate and use all post positions in drawing and report data", () => {
  const legacy = {
    ...createSystem("liniar"),
    height: 5000,
    intermediatePost: true,
  };
  delete legacy.intermediatePosts;
  const migrated = patchSystem(legacy, {});
  assert.equal(migrated.intermediatePosts, 1);
  assert.equal(migrated.height, 3000);
  assert.equal(migrated.postHeight, 2800);
  assert.equal(systemLayout(migrated).posts.filter((p) => p.extra).length, 1);
  assert.deepEqual(configurationErrors(migrated), []);
});
