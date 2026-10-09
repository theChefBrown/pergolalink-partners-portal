import * as THREE from "three";
import colours from "./colours.json";
import {
  isMotorized,
  isPergola,
  isRoof,
  membraneColours,
  modelFor,
  roofBays,
  textileColours,
} from "./catalog";
import type { SystemConfiguration } from "./types";
import { BIO_BEAM_HEIGHT, systemLayout } from "./layout";

export const colourHex = (id: string) =>
  colours.find((c) => c.id === id)?.hex ?? "#363d40";
const vec = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export function disposeGroup(group: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  group.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        materials.add(m);
    }
    if (o instanceof THREE.Sprite) materials.add(o.material);
  });
  materials.forEach((m) => {
    if ("map" in m && (m as THREE.MeshBasicMaterial).map)
      (m as THREE.MeshBasicMaterial).map!.dispose();
    m.dispose();
  });
}

export function buildModel(s: SystemConfiguration, withDimensions = true) {
  const layout = systemLayout(s);
  const root = new THREE.Group(),
    moving: ((p: number) => void)[] = [];
  const w = s.width / 1000,
    h = s.height / 1000,
    d = s.projection / 1000;
  const kind = modelFor(s.model).kind,
    roof = isRoof(s.model),
    double = kind === "retractable" && s.mount === "double",
    depth = roof ? d * (double ? 2 : 1) : 0.35;
  const material = (colour: string, metalness = 0.38) =>
    new THREE.MeshStandardMaterial({
      color: colour,
      roughness: 0.48,
      metalness,
    });
  const frame = material(colourHex(s.frameColour)),
    slatMat = material(colourHex(s.roofColour));
  const white = material("#eff2eb", 0.05),
    dark = material("#1c2529"),
    rubber = material("#242b2b", 0);
  const membrane = material(
    membraneColours.find((c) => c.id === s.membrane)?.hex ?? "#edece6",
    0,
  );
  const textile = material(textileColours[s.textile], 0);
  textile.side = THREE.DoubleSide;
  const tint = {
    clear: "#bcd9d9",
    brown: "#8d6651",
    grey: "#6d8186",
    stopsoll: "#a5a396",
    lowe: "#b8d7c8",
    kn66: "#76a8b0",
  }[s.glass];
  const glass = new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: s.glass === "stopsoll" ? 0.45 : 0.08,
    roughness: 0.12,
    transparent: true,
    opacity: s.glass === "clear" ? 0.28 : 0.52,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const led = new THREE.MeshBasicMaterial({
    color: s.lightTone === "warm" ? "#ffe4a3" : "#d7f1ff",
  });
  function box(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    mat: THREE.Material = frame,
    parent: THREE.Group = root,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.max(0.006, sx),
        Math.max(0.006, sy),
        Math.max(0.006, sz),
      ),
      mat,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function beam(
    a: THREE.Vector3,
    b: THREE.Vector3,
    size = 0.095,
    mat: THREE.Material = frame,
  ) {
    const midpoint = a.clone().add(b).multiplyScalar(0.5),
      mesh = box(
        midpoint.x,
        midpoint.y,
        midpoint.z,
        size,
        a.distanceTo(b),
        size,
        mat,
      );
    mesh.quaternion.setFromUnitVectors(
      vec(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return mesh;
  }
  function post(x: number, z: number, height: number) {
    box(x, height / 2, z, 0.14, height, 0.14);
    box(x, 0.035, z, 0.24, 0.07, 0.24);
  }
  function glazed(
    parent: THREE.Group,
    width: number,
    height: number,
    framed: boolean,
  ) {
    box(0, height / 2, 0, width, height, 0.012, glass, parent);
    box(0, 0.035, 0, width, 0.07, 0.08, frame, parent);
    if (framed) {
      box(0, height - 0.035, 0, width, 0.07, 0.07, frame, parent);
      box(-width / 2 + 0.025, height / 2, 0, 0.05, height, 0.07, frame, parent);
      box(width / 2 - 0.025, height / 2, 0, 0.05, height, 0.07, frame, parent);
    }
    // Discreet highlight makes transparent, frameless panels readable against the stage.
    box(
      -width / 2 + 0.012,
      height / 2,
      0.009,
      0.014,
      height - 0.08,
      0.006,
      white,
      parent,
    );
  }
  if (isPergola(s.model)) {
    const bio = kind === "bioclimatic",
      retractable = kind === "retractable";
    const front = layout.frontPostHeight / 1000,
      back = h - 0.1;
    const roofHeight = (z: number) =>
      layout.roofHeight((z + depth / 2) * 1000) / 1000;
    const level = (z: number) =>
      layout.roofLevel((z + depth / 2) * 1000) / 1000;
    const bays = retractable ? roofBays(s) : 1;
    const xs = Array.from(
      { length: bays + 1 },
      (_, i) => -w / 2 + (i * w) / bays,
    );
    if (s.mount === "wall" || s.mount === "rods") {
      const wallMat = new THREE.MeshStandardMaterial({
        color: "#bdc8bf",
        transparent: true,
        opacity: 0.28,
        roughness: 1,
      });
      box(0, h / 2, -depth / 2 - 0.22, w + 0.5, h + 0.3, 0.18, wallMat);
    }
    for (const support of layout.posts) {
      post(
        support.x / 1000 - w / 2,
        support.z / 1000 - depth / 2,
        support.height / 1000,
      );
    }
    for (const x of xs) {
      if (bio)
        box(
          x,
          h - BIO_BEAM_HEIGHT / 2000,
          0,
          0.14,
          BIO_BEAM_HEIGHT / 1000,
          depth,
        );
      const segments = bio ? 0 : s.model === "arcodia" ? 24 : double ? 2 : 1;
      for (let i = 0; i < segments; i++) {
        const z0 = -depth / 2 + (i * depth) / segments,
          z1 = -depth / 2 + ((i + 1) * depth) / segments;
        beam(vec(x, level(z0), z0), vec(x, level(z1), z1), bio ? 0.14 : 0.1);
      }
      if (s.mount === "rods")
        beam(
          vec(x, h + 0.7, -depth / 2),
          vec(x, level(depth / 2), depth / 2),
          0.025,
        );
    }
    box(
      0,
      roofHeight(depth / 2),
      depth / 2,
      w + 0.14,
      bio ? BIO_BEAM_HEIGHT / 1000 : 0.16,
      0.16,
    );
    box(
      0,
      roofHeight(-depth / 2),
      -depth / 2,
      w + 0.14,
      bio ? BIO_BEAM_HEIGHT / 1000 : 0.16,
      0.16,
    );
    if (double) box(0, back, 0, w + 0.14, 0.18, 0.18);
    if (s.mount === "freestanding" && !bio) {
      for (const x of [-w / 2, w / 2])
        box(x, front - 0.1, 0, 0.12, 0.14, depth);
    }
    if (bio) {
      const step = (depth - 0.18) / s.slats;
      for (let i = 0; i < s.slats; i++) {
        const pivot = new THREE.Group();
        pivot.position.set(0, h - 0.09, -depth / 2 + 0.09 + step * (i + 0.5));
        root.add(pivot);
        box(0, 0, 0, w - 0.16, 0.048, step * 0.97, slatMat, pivot);
        // Folded edge on each aluminium lamella.
        box(0, 0.025, step * 0.4, w - 0.16, 0.035, 0.022, slatMat, pivot);
        const closedZ = pivot.position.z;
        moving.push((p) => {
          pivot.rotation.x =
            THREE.MathUtils.degToRad(s.model === "liniar" ? 85 : 105) * p;
          pivot.position.z =
            s.model === "liniar"
              ? THREE.MathUtils.lerp(closedZ, -depth / 2 + 0.18 + i * 0.073, p)
              : closedZ;
        });
      }
      if (s.lighting) {
        box(0, h - 0.19, depth / 2 - 0.095, w - 0.2, 0.018, 0.022, led);
        box(0, h - 0.19, -depth / 2 + 0.095, w - 0.2, 0.018, 0.022, led);
      }
    } else if (retractable) {
      const runs = double
        ? [
            { start: 0, end: depth / 2 },
            { start: 0, end: -depth / 2 },
          ]
        : [{ start: -depth / 2, end: depth / 2 }];
      for (const run of runs) {
        const length = Math.abs(run.end - run.start),
          segments = Math.max(5, Math.ceil(length / 0.5)),
          direction = Math.sign(run.end - run.start),
          step = length / segments;
        for (let i = 0; i < segments; i++) {
          const strip = new THREE.Group();
          root.add(strip);
          const sheet = box(0, 0, 0, w - 0.13, 0.015, step, membrane, strip);
          box(
            0,
            -0.025,
            (-step / 2) * direction,
            w - 0.12,
            0.05,
            0.06,
            frame,
            strip,
          );
          if (s.lighting && i % 2 === 0) {
            for (let x = -w / 2 + 0.45; x < w / 2; x += 0.9)
              box(
                x,
                -0.054,
                (-step / 2) * direction,
                0.14,
                0.015,
                0.04,
                led,
                strip,
              );
          }
          moving.push((p) => {
            const ratio = 1 - p * 0.88,
              z = run.start + direction * (i + 0.5) * step * ratio;
            strip.position.set(0, level(z) + 0.02, z);
            const z0 = Math.max(-depth / 2, z - 0.01),
              z1 = Math.min(depth / 2, z + 0.01);
            strip.rotation.x = -Math.atan2(level(z1) - level(z0), z1 - z0);
            sheet.scale.z = ratio;
            sheet.position.y = -Math.sin((p * Math.PI) / 2) * step * 0.3;
          });
        }
        if (s.sheetRoof)
          box(
            0,
            level(run.start) + 0.12,
            run.start + direction * 0.2,
            w + 0.2,
            0.06,
            0.6,
            frame,
          );
      }
    } else {
      const count = roofBays(s),
        span = w / count;
      for (let i = 0; i < count; i++) {
        const x = -w / 2 + span * (i + 0.5),
          pane = box(
            x,
            (back + front) / 2 + 0.025,
            0,
            span - 0.055,
            0.025,
            Math.hypot(depth, front - back),
            glass,
          );
        pane.rotation.x = -Math.atan2(front - back, depth);
      }
      for (let i = 1; i < count; i++)
        beam(
          vec(-w / 2 + i * span, back, -depth / 2),
          vec(-w / 2 + i * span, front, depth / 2),
          0.065,
        );
      for (const spot of layout.lights) {
        const housing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.026, 12),
          dark,
        );
        housing.position.set(
          spot.x / 1000 - w / 2,
          spot.y / 1000,
          spot.z / 1000 - depth / 2,
        );
        root.add(housing);
        const lamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.049, 0.04, 0.025, 12),
          led,
        );
        lamp.position.copy(housing.position);
        lamp.position.y -= 0.024;
        root.add(lamp);
      }
    }
  } else if (s.model === "screenzip") {
    for (const x of [-w / 2, w / 2]) box(x, h / 2, 0, 0.075, h, 0.09);
    box(0, h, 0, w + 0.1, 0.14, 0.14);
    const fabric = box(0, h / 2, 0, w - 0.06, h, 0.015, textile),
      bottom = box(0, 0.045, 0, w, 0.07, 0.07);
    moving.push((p) => {
      const height = Math.max(0.04, h * (1 - p));
      fabric.scale.y = height / h;
      fabric.position.y = h - height / 2;
      bottom.position.y = h - height;
    });
  } else if (s.model === "skyzip") {
    for (const x of [-w / 2, w / 2]) box(x, h, 0, 0.075, 0.09, d);
    box(0, h, -d / 2, w + 0.1, 0.16, 0.16);
    const fabric = box(0, h, 0, w - 0.06, 0.018, d, textile),
      bottom = box(0, h, d / 2, w, 0.07, 0.07);
    moving.push((p) => {
      const length = Math.max(0.04, d * (1 - p));
      fabric.scale.z = length / d;
      fabric.position.z = -d / 2 + length / 2;
      bottom.position.z = -d / 2 + length;
    });
    // Neutral supports show this is a horizontal roof-mounted ZIP.
    const ghost = new THREE.MeshStandardMaterial({
      color: "#a6b8b0",
      transparent: true,
      opacity: 0.2,
    });
    for (const x of [-w / 2, w / 2])
      for (const z of [-d / 2, d / 2]) box(x, h / 2, z, 0.045, h, 0.045, ghost);
  } else if (s.model === "tripleglass") {
    for (const x of [-w / 2, w / 2]) box(x, h / 2, 0, 0.1, h, 0.17);
    box(0, h, 0, w, 0.13, 0.18);
    box(0, 0.045, 0, w, 0.09, 0.18);
    const panelHeight = (h - 0.12) / s.panels;
    for (let i = 0; i < s.panels; i++) {
      const panel = new THREE.Group();
      panel.position.set(0, 0.06 + i * panelHeight, i * 0.052);
      glazed(panel, w - 0.13, panelHeight, true);
      root.add(panel);
      moving.push((p) => (panel.position.y = 0.06 + i * panelHeight * (1 - p)));
    }
  } else {
    const span = (w - 0.08) / s.panels;
    for (const y of [0.025, h]) box(0, y, 0, w, 0.05, s.tracks * 0.055);
    for (let i = 0; i < s.tracks; i++)
      box(0, 0.055, (i - (s.tracks - 1) / 2) * 0.05, w, 0.015, 0.013, rubber);
    for (let i = 0; i < s.panels; i++) {
      const panel = new THREE.Group(),
        x = -w / 2 + 0.04 + span * (i + 0.5),
        right =
          s.opening === "right" ||
          (s.opening === "center" && i >= s.panels / 2);
      const index = right ? s.panels - 1 - i : i;
      panel.position.set(
        x,
        0.06,
        ((index % s.tracks) - (s.tracks - 1) / 2) * 0.055,
      );
      glazed(panel, span - 0.012, h - 0.11, s.model === "thermoglass");
      root.add(panel);
      moving.push((p) => {
        panel.position.x = THREE.MathUtils.lerp(
          x,
          (right ? 1 : -1) * (w / 2 - span / 2 - 0.04),
          p,
        );
      });
    }
  }
  if (isMotorized(s.model)) {
    const x =
        (s.model === "tripleglass" ? 1 : s.motorSide === "left" ? -1 : 1) *
        (w / 2 - 0.13),
      z = roof ? -depth / 2 + 0.08 : 0;
    box(x, h - 0.06, z, 0.16, 0.13, 0.3, dark);
    box(x, h + 0.014, z, 0.08, 0.012, 0.09, white);
  }
  const dimensions = new THREE.Group();
  root.add(dimensions);
  const lineMat = new THREE.LineBasicMaterial({
    color: "#738e87",
    transparent: true,
    opacity: 0.85,
  });
  function dimension(a: THREE.Vector3, b: THREE.Vector3, text: string) {
    dimensions.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat),
    );
    for (const point of [a, b]) {
      const delta =
        Math.abs(a.y - b.y) > 0.1 ? vec(0.1, 0, 0) : vec(0, 0.08, 0.07);
      dimensions.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            point.clone().sub(delta),
            point.clone().add(delta),
          ]),
          lineMat,
        ),
      );
    }
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#eaf0eb";
    ctx.beginPath();
    ctx.roundRect(1, 1, 254, 62, 14);
    ctx.fill();
    ctx.fillStyle = "#29403b";
    ctx.font = "600 27px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 33);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, depthTest: false }),
    );
    label.position.copy(a.clone().add(b).multiplyScalar(0.5));
    label.position.y += 0.08;
    const labelWidth = Math.max(w, depth, h) * 0.25;
    label.scale.set(labelWidth, labelWidth / 4, 1);
    dimensions.add(label);
  }
  if (withDimensions) {
    dimension(
      vec(-w / 2, 0.1, depth / 2 + 0.6),
      vec(w / 2, 0.1, depth / 2 + 0.6),
      s.width + " mm",
    );
    dimension(
      vec(-w / 2 - 0.5, 0, depth / 2),
      vec(-w / 2 - 0.5, h, depth / 2),
      s.height + " mm",
    );
    if (roof)
      dimension(
        vec(w / 2 + 0.5, 0.1, -depth / 2),
        vec(w / 2 + 0.5, 0.1, depth / 2),
        Math.round(depth * 1000) + " mm",
      );
  }
  const animate = (p: number) =>
    moving.forEach((fn) => fn(THREE.MathUtils.clamp(p, 0, 1)));
  animate(0);
  return { root, animate, width: w, height: h, depth };
}

export function createStage() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dfe7e0");
  scene.add(new THREE.HemisphereLight("#fafff7", "#7c958b", 2.8));
  const sun = new THREE.DirectionalLight("#fff0d6", 3.1);
  sun.position.set(-4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 15;
  sun.shadow.camera.bottom = -15;
  sun.shadow.camera.far = 45;
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#d8eaff", 1.2);
  fill.position.set(7, 5, -7);
  scene.add(fill);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: "#dfe7e0", roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(60, 60, "#bdcdc3", "#cbd7ce");
  grid.position.y = -0.025;
  scene.add(grid);
  scene.fog = new THREE.Fog("#dfe7e0", 25, 60);
  return scene;
}
export function positionCamera(
  camera: THREE.PerspectiveCamera,
  w: number,
  h: number,
  d: number,
) {
  const radius = Math.sqrt(w * w + h * h + d * d) / 2;
  const angle = Math.min(
    THREE.MathUtils.degToRad(camera.fov / 2),
    Math.atan(
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect,
    ),
  );
  const distance = (radius + 0.5) / Math.sin(angle);
  const target = vec(0, h * 0.47, 0);
  camera.position.copy(
    vec(1.15, 0.72, 1.5).normalize().multiplyScalar(distance).add(target),
  );
  camera.lookAt(target);
  camera.near = 0.05;
  camera.far = Math.max(100, distance * 5);
  camera.updateProjectionMatrix();
  return target;
}
