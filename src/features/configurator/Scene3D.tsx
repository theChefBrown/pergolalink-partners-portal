"use client";
/* eslint-disable react-hooks/set-state-in-effect -- WebGL capability and context readiness are external browser resources initialized in this effect. */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  buildModel,
  createStage,
  disposeGroup,
  positionCamera,
} from "./geometry";
import { getCopy } from "./locales";
import { configurationErrors } from './catalog';
import type { ConfigLocale, SystemConfiguration } from "./types";

type Runtime = {
  set: (s: SystemConfiguration, dimensions: boolean) => void;
  reset: () => void;
  render: () => void;
  animate: (p: number) => void;
  dispose: () => void;
};
export default function Scene3D({
  configuration,
  locale,
  progress,
  showDimensions,
  resetToken,
}: {
  configuration: SystemConfiguration;
  locale: ConfigLocale;
  progress: number;
  showDimensions: boolean;
  resetToken: number;
}) {
  const host = useRef<HTMLDivElement>(null),
    runtime = useRef<Runtime | null>(null);
  const [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const t = getCopy(locale);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);
    const scene = createStage(),
      camera = new THREE.PerspectiveCamera(38, 1, 0.05, 150),
      controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI / 2 - 0.025;
    controls.enablePan = true;
    controls.maxDistance = 90;
    controls.minDistance = 1;
    controls.target.set(0, 1.2, 0);
    let model: ReturnType<typeof buildModel> | undefined,
      frame = 0,
      dead = false;
    const draw = () => {
      if (frame || dead) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!dead) renderer.render(scene, camera);
      });
    };
    const reset = () => {
      if (model) {
        controls.target.copy(
          positionCamera(camera, model.width, model.height, model.depth),
        );
        controls.update();
        draw();
      }
    };
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      reset();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    controls.addEventListener("change", draw);
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const api: Runtime = {
      set(s, dimensions) {
        // Keep the last valid scene while a numeric input is empty or out of range.
        if (configurationErrors(s).length) return;
        if (model) {
          scene.remove(model.root);
          disposeGroup(model.root);
        }
        model = buildModel(s, dimensions);
        scene.add(model.root);
        reset();
      },
      reset,
      render: draw,
      animate(p) {
        model?.animate(p);
        draw();
      },
      dispose() {
        dead = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        disposeGroup(scene);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      },
    };
    runtime.current = api;
    resize();
    setFailed(false);
    return () => {
      runtime.current = null;
      api.dispose();
    };
  }, [attempt]);
  useEffect(() => {
    runtime.current?.set(configuration, showDimensions);
  }, [configuration, showDimensions, attempt]);
  useEffect(() => {
    runtime.current?.animate(progress);
  }, [progress, configuration, showDimensions, attempt]);
  useEffect(() => {
    runtime.current?.reset();
  }, [resetToken]);
  return (
    <div
      className="ac-scene-host"
      ref={host}
      role="img"
      aria-label={`${t.configure}: ${configuration.model}, ${configuration.width} × ${configuration.projection} × ${configuration.height} mm`}
    >
      {failed && (
        <div className="ac-scene-error" role="alert">
          <p>{t.webglError}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)}>
            {t.retry}
          </button>
        </div>
      )}
    </div>
  );
}

// Each report image is rendered from its own configuration, independently of the active editor.
export async function renderSnapshots(
  systems: SystemConfiguration[],
): Promise<Record<string, string>> {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(1400, 850);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = createStage(),
    camera = new THREE.PerspectiveCamera(38, 1400 / 850, 0.05, 150),
    images: Record<string, string> = {};
  try {
    for (const s of systems) {
      const model = buildModel(s, true);
      scene.add(model.root);
      model.animate(s.model === "aeris" || s.model === "eira" ? 0.25 : 0);
      positionCamera(camera, model.width, model.height, model.depth);
      renderer.render(scene, camera);
      images[s.id] = renderer.domElement.toDataURL("image/png");
      scene.remove(model.root);
      disposeGroup(model.root);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    disposeGroup(scene);
    renderer.dispose();
    renderer.forceContextLoss();
  }
  return images;
}
