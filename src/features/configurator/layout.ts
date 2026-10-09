import type { SystemConfiguration } from "./types";

export const MIN_POST_SPACING = 500;
// Fixed illustrative beam section, independent of the selected overall height.
export const BIO_BEAM_HEIGHT = 200;
export const intermediatePostCount = (s: SystemConfiguration) =>
  s.intermediatePosts ?? (s.intermediatePost ? 1 : 0);

/** Keep the supplied supports and distribute additions evenly within their bays. */
export function frontPostPlan(s: SystemConfiguration) {
  const pergola = [
    "eira",
    "aeris",
    "liniar",
    "imperium",
    "arcodia",
    "majestic",
    "wintergarden",
  ].includes(s.model);
  const width = Number.isFinite(s.width)
    ? Math.max(0, Math.min(30000, s.width))
    : 0;
  const retract = ["imperium", "arcodia", "majestic"].includes(s.model);
  const bays = retract ? Math.max(1, Math.ceil(width / 4000)) : 1;
  const anchors = Array.from(
    { length: bays + 1 },
    (_, i) => (width * i) / bays,
  );
  const included =
    pergola && !["existing", "rods"].includes(s.mount) ? anchors : [];
  const span = width / bays;
  const capacityPerBay = Math.max(0, Math.floor(span / MIN_POST_SPACING) - 1);
  // User rule: 5000 mm permits 10 front posts in total, including supplied posts.
  const maxExtra = pergola
    ? Math.max(
        0,
        Math.min(
          Math.floor(width / MIN_POST_SPACING) - included.length,
          capacityPerBay * bays,
        ),
      )
    : 0;
  const raw = intermediatePostCount(s);
  const count = Number.isFinite(raw)
    ? Math.max(0, Math.min(maxExtra, Math.floor(raw)))
    : 0;
  const allocations = Array<number>(bays).fill(0);
  for (let i = 0; i < count; i++) {
    let best = -1,
      gap = -1;
    for (let b = 0; b < bays; b++) {
      const nextGap = span / (allocations[b] + 2);
      if (allocations[b] < capacityPerBay && nextGap > gap) {
        best = b;
        gap = nextGap;
      }
    }
    if (best >= 0) allocations[best]++;
  }
  const extra = allocations.flatMap((n, b) =>
    Array.from(
      { length: n },
      (_, i) => anchors[b] + (span * (i + 1)) / (n + 1),
    ),
  );
  const positions = [...included, ...extra].sort((a, b) => a - b);
  return {
    anchors,
    included,
    extra,
    positions,
    maxExtra,
    maxTotal: included.length + maxExtra,
  };
}

/** Shared schematic layout in mm. Front is z = depth; left is x = 0. */
export function systemLayout(s: SystemConfiguration) {
  const bio = ["eira", "aeris", "liniar"].includes(s.model);
  const retract = ["imperium", "arcodia", "majestic"].includes(s.model);
  const pergola = bio || retract || s.model === "wintergarden";
  const roof = pergola || s.model === "skyzip";
  const double = retract && s.mount === "double";
  const width = s.width,
    height = s.height;
  const depth = roof ? s.projection * (double ? 2 : 1) : 350;
  const frontPosts = frontPostPlan(s),
    xs = frontPosts.anchors;
  const frontPostHeight = bio
    ? Math.max(0, height - BIO_BEAM_HEIGHT)
    : s.postHeight;
  const roofHeight = (z: number) =>
    bio
      ? height - 100
      : double
        ? height -
          100 -
          ((height - 100 - frontPostHeight) * Math.abs(z - depth / 2)) /
            (depth / 2)
        : height - 100 - ((height - 100 - frontPostHeight) * z) / depth;
  const roofLevel = (z: number) =>
    roofHeight(z) +
    (s.model === "arcodia"
      ? Math.min(300, Math.max(0, height - 100 - frontPostHeight) / Math.PI) *
        Math.sin(
          Math.PI *
            (double ? Math.abs(z - depth / 2) / (depth / 2) : z / depth),
        )
      : 0);
  const posts: { x: number; z: number; height: number; extra: boolean }[] = [];
  const add = (x: number, z: number, extra = false) =>
    posts.push({ x, z, height: bio ? frontPostHeight : roofHeight(z), extra });
  if (pergola) {
    for (const x of xs) {
      if (!["existing", "rods"].includes(s.mount)) add(x, depth);
      if (s.mount === "freestanding" || double) add(x, 0);
      if (double) add(x, depth / 2);
    }
    for (const x of frontPosts.extra) add(x, depth, true);
  }
  const glassBays = Math.max(1, Math.ceil(width / 900));
  const lights: { x: number; y: number; z: number }[] = [];
  if (s.model === "wintergarden" && s.lighting) {
    // Three illustrative spots per glass-support profile, including edge profiles.
    for (let i = 0; i <= glassBays; i++) {
      for (const fraction of [0.2, 0.5, 0.8]) {
        const z = depth * fraction;
        lights.push({ x: (width * i) / glassBays, y: roofHeight(z) - 60, z });
      }
    }
  }
  return {
    bio,
    retract,
    pergola,
    roof,
    double,
    width,
    height,
    depth,
    xs,
    posts,
    frontPosts,
    frontPostHeight,
    lights,
    glassBays,
    roofHeight,
    roofLevel,
  };
}
