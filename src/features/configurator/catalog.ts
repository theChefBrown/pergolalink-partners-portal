import type { ModelId, Mount, SystemConfiguration, SystemKind } from "./types";
import {
  BIO_BEAM_HEIGHT,
  frontPostPlan,
  intermediatePostCount,
} from "./layout";
export const models: {
  id: ModelId;
  name: string;
  kind: SystemKind;
  width?: number;
  projection?: number;
  height?: number;
}[] = [
  {
    id: "eira",
    name: "Eira",
    kind: "bioclimatic",
    width: 3200,
    projection: 6065,
    height: 3000,
  },
  {
    id: "aeris",
    name: "Aeris",
    kind: "bioclimatic",
    width: 4000,
    projection: 6970,
    height: 3000,
  },
  {
    id: "liniar",
    name: "Liniar",
    kind: "bioclimatic",
    width: 4000,
    projection: 6970,
    height: 3000,
  },
  {
    id: "imperium",
    name: "Imperium",
    kind: "retractable",
    width: 11000,
    projection: 7000,
    height: 3000,
  },
  {
    id: "arcodia",
    name: "Arcodia",
    kind: "retractable",
    width: 11000,
    projection: 11000,
    height: 3000,
  },
  {
    id: "majestic",
    name: "Majestic",
    kind: "retractable",
    width: 11000,
    projection: 11000,
    height: 3000,
  },
  { id: "runglass", name: "Runglass", kind: "runglass", height: 3000 },
  { id: "thermoglass", name: "Thermoglass", kind: "thermoglass", height: 3000 },
  {
    id: "tripleglass",
    name: "Tripleglass",
    kind: "tripleglass",
    width: 3800,
    height: 3000,
  },
  {
    id: "wintergarden",
    name: "Wintergarden",
    kind: "wintergarden",
    width: 10000,
    projection: 4000,
    height: 3000,
  },
  {
    id: "screenzip",
    name: "Screen Zip",
    kind: "screenzip",
    width: 4000,
    height: 3000,
  },
  {
    id: "skyzip",
    name: "Sky Zip",
    kind: "skyzip",
    width: 6000,
    projection: 4000,
  },
];
// Eira row 9 is excluded pending clarification: the supplied photo duplicates 2165 mm at rows 9 and 10.
export const eiraSlats = Array.from({ length: 30 }, (_, i) => ({
  count: i + 1,
  projection: 410 + i * 195,
})).filter((r) => r.count !== 9);
export const aerisSlats = [
  1175, 1410, 1640, 1870, 2105, 2335, 2565, 2800, 3030, 3260, 3495, 3725, 3955,
  4190, 4420, 4650, 4885, 5115, 5345, 5580, 5810, 6040, 6275, 6505, 6735, 6970,
].map((projection, i) => ({ count: i + 4, projection }));
export const slatTable = (model: ModelId) =>
  model === "eira" ? eiraSlats : aerisSlats;
export const modelFor = (id: ModelId) => models.find((m) => m.id === id)!;
export const isRoof = (id: ModelId) =>
  ["bioclimatic", "retractable", "wintergarden", "skyzip"].includes(
    modelFor(id).kind,
  );
export const isPergola = (id: ModelId) =>
  ["bioclimatic", "retractable", "wintergarden"].includes(modelFor(id).kind);
export const isMotorized = (id: ModelId) =>
  !["runglass", "thermoglass", "wintergarden"].includes(id);
export const mountsFor = (id: ModelId): Mount[] =>
  modelFor(id).kind === "retractable"
    ? ["wall", "freestanding", "existing", "rods", "double"]
    : id === "wintergarden"
      ? ["wall", "freestanding"]
      : ["wall", "freestanding", "existing"];
export const membraneColours = [
  { id: "716 1P4", hex: "#e6e3dc", label: "whiteTexture" },
  { id: "716 8P2", hex: "#b4a78e", label: "beigeGrey" },
  { id: "716 2P0", hex: "#d7cba9", label: "cream" },
  { id: "716 833", hex: "#e4dfcf", label: "offWhite" },
  { id: "716 739", hex: "#655245", label: "membraneBrown" },
  { id: "716 114", hex: "#f4f3ed", label: "white" },
  { id: "716 260", hex: "#e2d3ae", label: "cream" },
] as const;
export const textileColours = {
  white: "#f4f4ee",
  lightGrey: "#b8bdba",
  cream: "#d9c9a5",
  anthracite: "#343e42",
};
export const slidingGlassOptions = [
  "clear",
  "brown",
  "grey",
  "stopsoll",
] as const;
export function createSystem(
  model: ModelId = "aeris",
  id = crypto.randomUUID(),
): SystemConfiguration {
  const m = modelFor(model);
  return {
    id,
    model,
    label: "",
    quantity: 1,
    width: Math.min(m.width ?? 4000, 4000),
    projection:
      m.kind === "bioclimatic"
        ? slatTable(model).find((r) => r.count === 15)!.projection
        : 3000,
    height: 2800,
    postHeight:
      m.kind === "retractable" || model === "wintergarden" ? 2500 : 2600,
    slats: 15,
    mount: "freestanding",
    frameColour: "RAL 7016",
    roofColour: "RAL 9010",
    membrane: "716 114",
    textile: "anthracite",
    motor: "DemoDrive",
    motorSide: "left",
    remote: true,
    channels: 1,
    lighting: false,
    intermediatePosts: 0,
    lightTone: "warm",
    sheetRoof: false,
    glass: "clear",
    laminate: "4.4.2",
    panels: model === "tripleglass" ? 3 : 4,
    tracks: 4,
    opening: "left",
    notes: "",
  };
}
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const attachmentBytes = (files: readonly { size: number }[]) =>
  files.reduce((n, f) => n + f.size, 0);
export function configurationErrors(s: SystemConfiguration): string[] {
  const m = modelFor(s.model),
    errors: string[] = [];
  const finite = (n: number) => Number.isFinite(n) && n > 0;
  if (!m) return ["invalidConfiguration"];
  if (!finite(s.width) || (m.width && s.width > m.width) || s.width > 30000)
    errors.push("width");
  if (
    !finite(s.height) ||
    (m.height && s.height > m.height) ||
    s.height > 10000
  )
    errors.push("height");
  if (
    isRoof(s.model) &&
    (!finite(s.projection) || (m.projection && s.projection > m.projection))
  )
    errors.push("projection");
  if (isPergola(s.model) && (!finite(s.postHeight) || s.postHeight > s.height))
    errors.push("postHeight");
  if (m.kind === "bioclimatic" && s.postHeight !== s.height - BIO_BEAM_HEIGHT)
    errors.push("postHeight");
  if (isPergola(s.model)) {
    const count = intermediatePostCount(s);
    if (
      !Number.isInteger(count) ||
      count < 0 ||
      count > frontPostPlan(s).maxExtra
    )
      errors.push("intermediatePosts");
  }
  if (
    m.kind === "bioclimatic" &&
    !slatTable(s.model).some(
      (r) => r.count === s.slats && r.projection === s.projection,
    )
  )
    errors.push("slats");
  if (!Number.isInteger(s.quantity) || s.quantity < 1 || s.quantity > 99)
    errors.push("quantity");
  if (isPergola(s.model) && !mountsFor(s.model).includes(s.mount))
    errors.push("mount");
  if (
    s.model === "thermoglass" &&
    ((s.panels > 4 && s.opening !== "center") || s.tracks !== 4)
  )
    errors.push("opening");
  if (
    ["runglass", "thermoglass"].includes(s.model) &&
    (!slidingGlassOptions.includes(
      s.glass as (typeof slidingGlassOptions)[number],
    ) ||
      !Number.isInteger(s.panels) ||
      s.panels < 2 ||
      s.panels > (s.opening === "center" ? s.tracks * 2 : s.tracks))
  )
    errors.push("panels");
  if (s.model === "tripleglass" && ![2, 3].includes(s.panels))
    errors.push("panels");
  return errors;
}
export function patchSystem(
  s: SystemConfiguration,
  patch: Partial<SystemConfiguration>,
): SystemConfiguration {
  const next = { ...s, ...patch };
  if (isPergola(next.model)) {
    if (Number.isFinite(next.height)) next.height = Math.min(3000, next.height);
    if (modelFor(next.model).kind === "bioclimatic") {
      if (
        patch.postHeight !== undefined &&
        patch.height === undefined &&
        Number.isFinite(patch.postHeight)
      )
        next.height = Math.min(3000, patch.postHeight + BIO_BEAM_HEIGHT);
      next.postHeight = Math.max(0, next.height - BIO_BEAM_HEIGHT);
    } else if (next.height > 100) {
      next.postHeight = Math.min(next.postHeight, next.height - 100);
    }
    const requested =
      patch.intermediatePost !== undefined &&
      patch.intermediatePosts === undefined
        ? patch.intermediatePost
          ? 1
          : 0
        : intermediatePostCount(next);
    next.intermediatePosts = Number.isFinite(requested)
      ? Math.max(
          0,
          Math.min(frontPostPlan(next).maxExtra, Math.floor(requested)),
        )
      : 0;
    delete next.intermediatePost;
  }
  if (next.model === "thermoglass") {
    next.tracks = 4;
    if (next.panels > 4) next.opening = "center";
  }
  if (
    next.model === "runglass" &&
    next.panels > (next.opening === "center" ? 2 : 1) * next.tracks
  )
    next.panels = (next.opening === "center" ? 2 : 1) * next.tracks;
  return next;
}
export const roofBays = (s: SystemConfiguration) =>
  Math.max(1, Math.ceil(s.width / (s.model === "wintergarden" ? 900 : 4000)));
