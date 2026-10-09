import { getCopy, type CopyKey } from "./locales";
import {
  isMotorized,
  isPergola,
  isRoof,
  membraneColours,
  modelFor,
  roofBays,
} from "./catalog";
import type { ConfigLocale, SystemConfiguration } from "./types";
import { systemLayout } from "./layout";
export function glassLabel(
  model: string,
  glass: SystemConfiguration["glass"],
  locale: ConfigLocale,
) {
  const t = getCopy(locale);
  if (["runglass", "thermoglass"].includes(model)) return t[glass];
  return glass === "clear"
    ? `${t.clearShort} + ${t.clearShort}`
    : ["brown", "grey", "stopsoll"].includes(glass)
      ? `${t.clearShort} + ${t[glass]}`
      : t[glass];
}
export function systemRows(
  s: SystemConfiguration,
  locale: ConfigLocale,
): [string, string][] {
  const layout = systemLayout(s);
  const t = getCopy(locale),
    kind = modelFor(s.model).kind;
  const rows: [string, string][] = [
    [t.model, modelFor(s.model).name],
    [t.quantity, String(s.quantity)],
    [t.width, `${s.width} mm`],
    [t.height, `${s.height} mm`],
  ];
  if (s.label) rows.unshift([t.label, s.label]);
  if (isRoof(s.model))
    rows.push([
      s.mount === "double" ? t.projectionDouble : t.projection,
      `${s.projection} mm`,
    ]);
  if (isPergola(s.model))
    rows.push(
      [t.postHeight, `${layout.frontPostHeight} mm`],
      [t.mount, t[s.mount]],
      [t.intermediatePosts, String(layout.frontPosts.extra.length)],
      [t.includedPosts, String(layout.frontPosts.included.length)],
      [t.totalFrontPosts, String(layout.frontPosts.positions.length)],
    );
  if (layout.frontPosts.extra.length)
    rows.push([
      t.postPosition,
      layout.frontPosts.extra
        .map((x, i) => `P${i + 1}: ${Math.round(x)} mm`)
        .join(" · "),
    ]);
  if (kind === "bioclimatic") rows.push([t.slats, String(s.slats)]);
  rows.push([t.frameColour, s.frameColour]);
  if (kind === "bioclimatic") rows.push([t.roofColour, s.roofColour]);
  if (kind === "retractable")
    rows.push(
      [
        t.membrane,
        s.membrane +
          " · " +
          t[membraneColours.find((c) => c.id === s.membrane)!.label],
      ],
      [t.sheetRoof, t[s.sheetRoof ? "yes" : "no"]],
    );
  if (s.model === "screenzip" || s.model === "skyzip")
    rows.push([t.textile, t[s.textile]]);
  if (
    ["runglass", "thermoglass", "tripleglass", "wintergarden"].includes(s.model)
  )
    rows.push([t.glass, glassLabel(s.model, s.glass, locale)]);
  if (s.model === "runglass") rows.push([t.glassThickness, "10 mm"]);
  if (s.model === "wintergarden")
    rows.push([t.laminate, s.laminate], [t.panels, String(roofBays(s))]);
  if (["runglass", "thermoglass", "tripleglass"].includes(s.model))
    rows.push([t.panels, String(s.panels)]);
  if (["runglass", "thermoglass"].includes(s.model))
    rows.push(
      [t.tracks, String(s.tracks)],
      [t.opening, t[s.opening] + " · " + t.exterior],
    );
  if (isMotorized(s.model)) {
    rows.push(
      [t.motor, s.motor],
      [
        t.motorSide,
        s.model === "tripleglass"
          ? t.interior
          : t[s.motorSide] + " · " + t.exterior,
      ],
      [t.remote, t[s.remote ? "yes" : "no"]],
    );
    if (s.remote) rows.push([t.channels, String(s.channels)]);
  }
  if (isPergola(s.model)) {
    rows.push([
      s.model === "wintergarden" ? t.ledSpots : t.lighting,
      t[s.lighting ? "yes" : "no"],
    ]);
    if (s.lighting) rows.push([t.lightTone, t[s.lightTone]]);
  }
  return rows;
}
export function errorLabel(key: string, locale: ConfigLocale) {
  const t = getCopy(locale);
  return t[key as CopyKey] ?? t.invalidConfiguration;
}

/** Shared production groups keep the report complete when configuration fields evolve. */
export function systemSections(s: SystemConfiguration, locale: ConfigLocale) {
  const t = getCopy(locale);
  const groups = [
    {
      title: t.dimensions,
      labels: [
        t.width,
        t.projection,
        t.projectionDouble,
        t.height,
        t.postHeight,
      ],
    },
    {
      title: t.construction,
      labels: [
        t.mount,
        t.intermediatePosts,
        t.includedPosts,
        t.totalFrontPosts,
        t.postPosition,
        t.slats,
        t.panels,
        t.tracks,
        t.opening,
      ],
    },
    {
      title: t.finishes,
      labels: [
        t.frameColour,
        t.roofColour,
        t.membrane,
        t.textile,
        t.glass,
        t.glassThickness,
        t.laminate,
      ],
    },
    {
      title: t.equipment,
      labels: [
        t.motor,
        t.motorSide,
        t.remote,
        t.channels,
        t.lighting,
        t.ledSpots,
        t.lightTone,
        t.sheetRoof,
      ],
    },
  ];
  const rows = systemRows(s, locale);
  const covered = new Set([
    t.model,
    t.label,
    t.quantity,
    ...groups.flatMap((g) => g.labels),
  ]);
  const sections = groups
    .map((g) => ({
      title: g.title,
      rows: rows.filter(([key]) => g.labels.includes(key)),
    }))
    .filter((g) => g.rows.length);
  const other = rows.filter(([key]) => !covered.has(key));
  if (other.length) sections.push({ title: t.technicalIndex, rows: other });
  return sections;
}
