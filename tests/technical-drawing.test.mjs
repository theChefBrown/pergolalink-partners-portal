import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
// The application bundler resolves extensionless TS imports; mirror that for Node's test runner.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith("./") &&
      context.parentURL?.includes("/features/configurator/") &&
      !/\.[a-z]+$/.test(specifier)
    )
      return nextResolve(specifier + ".ts", context);
    return nextResolve(specifier, context);
  },
});
const { createSystem, models } = await import(
  "../src/features/configurator/catalog.ts"
);
const { technicalDrawing, drawingSvg, drawingViews } = await import(
  "../src/features/configurator/technical-drawing.ts"
);

test("all product drawings have bounded finite coordinates and width/height dimensions", () => {
  for (const model of models) {
    for (const size of [
      {},
      {
        width: model.width ?? 30000,
        height: model.height ?? 10000,
        projection: model.projection ?? 3000,
      },
    ]) {
      const s = {
        ...createSystem(model.id),
        ...size,
        intermediatePosts: 1,
        lighting: true,
      };
      for (const view of drawingViews) {
        const marks = technicalDrawing(s, "ro", view);
        for (const m of marks) {
          assert.ok(
            Object.values(m)
              .filter((v) => typeof v === "number")
              .every(Number.isFinite),
            model.id,
          );
          assert.ok(
            m.x >= 0 && m.x <= 520 && m.y >= 0 && m.y <= 360,
            model.id + view,
          );
        }
        const labels = marks
          .filter((m) => m.kind === "text")
          .map((m) => m.value);
        if (view === "frontView") {
          assert.ok(labels.includes(`${s.width} mm`));
          assert.ok(labels.includes(`${s.height} mm`));
        }
      }
    }
  }
});

test("drawings update dimensions, distinguish Double projection, and escape SVG titles", () => {
  const s = {
    ...createSystem("imperium"),
    mount: "double",
    projection: 3500,
    width: 8000,
    intermediatePosts: 1,
  };
  const labels = technicalDrawing(s, "en", "sideView")
    .filter((m) => m.kind === "text")
    .map((m) => m.value);
  assert.ok(labels.includes("7000 mm"));
  assert.ok(labels.includes("3500 mm"));
  const changed = technicalDrawing({ ...s, width: 7600 }, "ro", "frontView");
  assert.ok(changed.some((m) => m.kind === "text" && m.value === "7600 mm"));
  assert.ok(!changed.some((m) => m.kind === "text" && m.value === "8000 mm"));
  const svg = drawingSvg(changed, '<script>alert("x")</script>');
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("&lt;script&gt;"));
});

test("invalid in-progress dimensions do not produce invalid SVG", () => {
  for (const width of [0, NaN, Infinity]) {
    const svg = drawingSvg(
      technicalDrawing({ ...createSystem("aeris"), width }, "ro", "frontView"),
      "Aeris",
    );
    assert.ok(!/NaN|Infinity/.test(svg));
    assert.ok(!svg.includes("<line"));
  }
});

test("every additional post is identified in the drawing and itemized in the report", async () => {
  const { systemRows } = await import(
    "../src/features/configurator/summary.ts"
  );
  const { getCopy } = await import("../src/features/configurator/locales.ts");
  const t = getCopy("ro"),
    s = { ...createSystem("imperium"), width: 5000, intermediatePosts: 7 };
  const drawing = technicalDrawing(s, "ro", "frontView");
  const identifiers = drawing
    .filter((m) => m.kind === "text" && /^P\d+$/.test(m.value))
    .map((m) => m.value);
  assert.deepEqual(identifiers, ["P1", "P2", "P3", "P4", "P5", "P6", "P7"]);
  const rows = new Map(systemRows(s, "ro"));
  assert.equal(rows.get(t.intermediatePosts), "7");
  assert.equal(rows.get(t.includedPosts), "3");
  assert.equal(rows.get(t.totalFrontPosts), "10");
  for (const id of identifiers)
    assert.ok(rows.get(t.postPosition).includes(id + ":"));
});
