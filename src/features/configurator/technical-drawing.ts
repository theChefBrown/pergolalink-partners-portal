import { BIO_BEAM_HEIGHT, systemLayout } from "./layout";
import { getCopy } from "./locales";
import type { ConfigLocale, SystemConfiguration } from "./types";

export type DrawingView = "frontView" | "sideView" | "topView";
export type DrawingMark =
  | {
      kind: "line";
      x: number;
      y: number;
      x2: number;
      y2: number;
      colour: string;
      weight: number;
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      colour: string;
      fill: string;
      weight: number;
    }
  | {
      kind: "circle";
      x: number;
      y: number;
      radius: number;
      colour: string;
      fill: string;
      weight: number;
    }
  | {
      kind: "text";
      x: number;
      y: number;
      value: string;
      size: number;
      colour: string;
      anchor: "start" | "middle";
      vertical?: boolean;
    };
export const DRAWING_WIDTH = 520,
  DRAWING_HEIGHT = 360;
export const drawingViews: DrawingView[] = ["frontView", "sideView", "topView"];

/** Orthographic schematic shared by the SVG viewer and the vector PDF. */
export function technicalDrawing(
  s: SystemConfiguration,
  locale: ConfigLocale,
  view: DrawingView,
): DrawingMark[] {
  const l = systemLayout(s),
    t = getCopy(locale),
    marks: DrawingMark[] = [];
  const ink = "#304b48",
    thin = "#91a8a4",
    accent = "#b46d27",
    glass = "#e5f0f1";
  const line = (
    x: number,
    y: number,
    x2: number,
    y2: number,
    colour = ink,
    weight = 1.5,
  ) => marks.push({ kind: "line", x, y, x2, y2, colour, weight });
  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill = "#eef3ef",
    colour = ink,
    weight = 1.5,
  ) => marks.push({ kind: "rect", x, y, width, height, fill, colour, weight });
  const text = (
    value: string,
    x: number,
    y: number,
    size = 14,
    colour = ink,
    anchor: "start" | "middle" = "middle",
    vertical = false,
  ) =>
    marks.push({ kind: "text", value, x, y, size, colour, anchor, vertical });
  text(t[view], 24, 29, 17, ink, "start");
  // Invalid intermediate input must never produce NaN SVG coordinates.
  if (
    ![l.width, l.height, l.depth, s.postHeight].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  ) {
    text(t.invalidConfiguration, 260, 180, 13);
    return marks;
  }
  const horizontal = view === "sideView" ? l.depth : l.width;
  const vertical =
    view === "topView" ? l.depth : l.height + (s.model === "arcodia" ? 300 : 0);
  const scale = Math.min(370 / horizontal, 198 / vertical);
  const left = (520 - horizontal * scale) / 2,
    bottom = 263;
  const X = (value: number) => left + value * scale;
  const Y = (value: number) => bottom - value * scale;
  const hDim = (
    a: number,
    b: number,
    value: number,
    y = 295,
    colour = ink,
    compact = false,
  ) => {
    if (b - a < 1) return;
    const extensionTop = y > 300 ? 301 : bottom + 7;
    line(a, extensionTop, a, y + 6, thin, 0.7);
    line(b, extensionTop, b, y + 6, thin, 0.7);
    line(a, y, b, y, colour, 1);
    for (const x of [a, b]) line(x - 3, y + 4, x + 3, y - 4, colour, 1);
    const label = `${Math.round(value)}${compact ? "" : " mm"}`;
    const size = compact
      ? Math.max(7, Math.min(11, ((b - a) / label.length) * 1.6))
      : 14;
    text(label, (a + b) / 2, y - 7, size, colour);
  };
  const vDim = (value: number, x: number, colour = ink) => {
    const top = Y(value);
    line(x, top, x, bottom, colour, 1);
    for (const y of [top, bottom]) {
      line(x - 4, y + 3, x + 4, y - 3, colour, 1);
      line(x - 7, y, x + 7, y, thin, 0.7);
    }
    text(
      `${Math.round(value)} mm`,
      x - 9,
      (top + bottom) / 2,
      14,
      colour,
      "middle",
      true,
    );
  };
  if (view === "topView") {
    rect(
      X(0),
      Y(l.depth),
      l.width * scale,
      l.depth * scale,
      l.roof ? glass : "#f0f3f1",
    );
    if (l.roof) {
      text(t.frontView, X(l.width / 2), Y(l.depth) - 12, 12, thin);
      if (l.bio || l.retract) {
        const n = l.bio ? s.slats : Math.max(5, Math.ceil(l.depth / 500));
        for (let i = 1; i < n; i++)
          line(
            X(0),
            Y((l.depth * i) / n),
            X(l.width),
            Y((l.depth * i) / n),
            thin,
            0.7,
          );
      }
      const xs =
        s.model === "wintergarden"
          ? Array.from(
              { length: l.glassBays + 1 },
              (_, i) => (l.width * i) / l.glassBays,
            )
          : l.xs;
      for (const x of xs) line(X(x), Y(0), X(x), Y(l.depth), ink, 2);
      if (l.double)
        line(X(0), Y(l.depth / 2), X(l.width), Y(l.depth / 2), ink, 3);
      for (const p of l.posts)
        rect(
          X(p.x) - 3.5,
          Y(p.z) - 3.5,
          7,
          7,
          p.extra ? accent : ink,
          p.extra ? accent : ink,
        );
      for (const p of l.lights)
        marks.push({
          kind: "circle",
          x: X(p.x),
          y: Y(p.z),
          radius: 3.5,
          colour: accent,
          fill: "#ffe6a4",
          weight: 1,
        });
      // In a plan view, dimension the complete footprint (Double = 2 × projection).
      vDim(l.depth, left - 22);
    } else {
      const tracks = ["runglass", "thermoglass"].includes(s.model)
        ? s.tracks
        : 1;
      for (let i = 1; i <= tracks; i++)
        line(
          X(0),
          Y((l.depth * i) / (tracks + 1)),
          X(l.width),
          Y((l.depth * i) / (tracks + 1)),
          thin,
        );
      text(t.indicativeDepth, 260, 337, 12, thin);
    }
    hDim(X(0), X(l.width), l.width);
  } else if (view === "frontView") {
    line(X(0) - 15, bottom, X(l.width) + 15, bottom, thin, 1);
    if (l.pergola) {
      const frontHeight = l.bio ? l.height - 100 : l.roofHeight(l.depth);
      const beamHeight = l.bio ? BIO_BEAM_HEIGHT : 160;
      rect(
        X(0),
        Y(frontHeight + beamHeight / 2),
        l.width * scale,
        beamHeight * scale,
        ink,
      );
      if (!l.bio)
        line(X(0), Y(l.height - 100), X(l.width), Y(l.height - 100), thin, 1);
      // Rear/central columns are light; the optional front support is highlighted.
      const posts = [...l.posts].sort((a, b) => a.z - b.z);
      for (const p of posts)
        rect(
          X(p.x) - 2.5,
          Y(p.height),
          5,
          p.height * scale,
          p.extra ? accent : p.z === l.depth ? ink : "#c6d2ce",
          p.extra ? accent : p.z === l.depth ? ink : "#c6d2ce",
        );
      l.frontPosts.extra.forEach((x, i) =>
        text(`P${i + 1}`, X(x), Y(l.height) - 12, 10, accent),
      );
      vDim(l.frontPostHeight, X(l.width) + 28);
    } else {
      rect(
        X(0),
        Y(l.height),
        l.width * scale,
        l.height * scale,
        s.model === "screenzip" ? "#e9e9e0" : glass,
      );
      if (s.model === "tripleglass") {
        for (let i = 1; i < s.panels; i++)
          line(
            X(0),
            Y((l.height * i) / s.panels),
            X(l.width),
            Y((l.height * i) / s.panels),
          );
      } else if (["runglass", "thermoglass"].includes(s.model)) {
        for (let i = 1; i < s.panels; i++)
          line(
            X((l.width * i) / s.panels),
            Y(0),
            X((l.width * i) / s.panels),
            Y(l.height),
          );
      } else if (s.model === "skyzip") {
        // The roof ZIP has no vertical fabric; erase the opening and show the roof cassette.
        rect(
          X(0),
          Y(l.height) + 4,
          l.width * scale,
          l.height * scale - 4,
          "#ffffff",
          "#ffffff",
          0,
        );
        line(X(0), Y(l.height), X(l.width), Y(l.height), ink, 5);
      }
    }
    vDim(l.height, left - 22);
    hDim(X(0), X(l.width), l.width);
    if (l.frontPosts.extra.length) {
      const xs = [...new Set([0, ...l.frontPosts.positions, l.width])].sort(
        (a, b) => a - b,
      );
      for (let i = 1; i < xs.length; i++)
        hDim(X(xs[i - 1]), X(xs[i]), xs[i] - xs[i - 1], 327, accent, true);
    }
  } else {
    line(X(0) - 15, bottom, X(l.depth) + 15, bottom, thin, 1);
    if (l.pergola) {
      for (const p of l.posts)
        rect(
          X(p.z) - 2.5,
          Y(p.height),
          5,
          p.height * scale,
          p.extra ? accent : ink,
          p.extra ? accent : ink,
        );
      for (let i = 0; i < 32; i++) {
        const a = (l.depth * i) / 32,
          b = (l.depth * (i + 1)) / 32;
        line(
          X(a),
          Y(l.roofLevel(a)),
          X(b),
          Y(l.roofLevel(b)),
          ink,
          l.bio ? BIO_BEAM_HEIGHT * scale : 3,
        );
      }
      // Show light locations on the slope; overlapping profile projections are deduplicated.
      const zs = new Set(l.lights.map((p) => p.z));
      for (const z of zs)
        marks.push({
          kind: "circle",
          x: X(z),
          y: Y(l.roofHeight(z) - 60),
          radius: 3.5,
          colour: accent,
          fill: "#ffe6a4",
          weight: 1,
        });
      vDim(l.frontPostHeight, X(l.depth) + 28);
    } else if (s.model === "skyzip")
      line(X(0), Y(l.height), X(l.depth), Y(l.height), ink, 5);
    else rect(X(0), Y(l.height), l.depth * scale, l.height * scale, glass);
    vDim(l.height, left - 22);
    if (l.roof) {
      hDim(X(0), X(l.depth), l.depth);
      if (l.double) hDim(X(0), X(l.depth / 2), s.projection, 327, accent);
    } else text(t.indicativeDepth, 260, 309, 12, thin);
  }
  return marks;
}

const xml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!,
  );
export function drawingSvg(marks: DrawingMark[], title: string) {
  const body = marks
    .map((m) => {
      if (m.kind === "line")
        return `<line x1="${m.x}" y1="${m.y}" x2="${m.x2}" y2="${m.y2}" stroke="${m.colour}" stroke-width="${m.weight}"/>`;
      if (m.kind === "rect")
        return `<rect x="${m.x}" y="${m.y}" width="${Math.max(0, m.width)}" height="${Math.max(0, m.height)}" fill="${m.fill}" stroke="${m.colour}" stroke-width="${m.weight}"/>`;
      if (m.kind === "circle")
        return `<circle cx="${m.x}" cy="${m.y}" r="${m.radius}" fill="${m.fill}" stroke="${m.colour}" stroke-width="${m.weight}"/>`;
      return `<text x="${m.x}" y="${m.y}" font-size="${m.size}" fill="${m.colour}" text-anchor="${m.anchor}"${m.vertical ? ` transform="rotate(-90 ${m.x} ${m.y})"` : ""}>${xml(m.value)}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DRAWING_WIDTH} ${DRAWING_HEIGHT}" role="img" aria-label="${xml(title)}" font-family="Arial, sans-serif"><title>${xml(title)}</title>${body}</svg>`;
}
