"use client";
import { useMemo, useState } from "react";
import {
  drawingSvg,
  drawingViews,
  technicalDrawing,
  type DrawingView,
} from "./technical-drawing";
import { getCopy } from "./locales";
import { modelFor } from "./catalog";
import { intermediatePostCount } from "./layout";
import type { ConfigLocale, SystemConfiguration } from "./types";

export function TechnicalDrawing({
  system,
  locale,
}: {
  system: SystemConfiguration;
  locale: ConfigLocale;
}) {
  const [view, setView] = useState<DrawingView>("frontView"),
    t = getCopy(locale);
  const svg = useMemo(
    () =>
      drawingSvg(
        technicalDrawing(system, locale, view),
        `${modelFor(system.model).name} · ${t[view]}`,
      ),
    [system, locale, view, t],
  );
  return (
    <div className="ac-technical">
      <div className="ac-drawing-views" aria-label={t.technicalDrawing}>
        {drawingViews.map((key) => (
          <button
            type="button"
            key={key}
            aria-pressed={key === view}
            onClick={() => setView(key)}
          >
            {t[key]}
          </button>
        ))}
      </div>
      <div
        className="ac-drawing-sheet"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="ac-drawing-legend">
        {intermediatePostCount(system) > 0 && (
          <span>
            <i />
            {t.intermediatePosts} · {intermediatePostCount(system)}
          </span>
        )}
        {system.model === "wintergarden" && system.lighting && (
          <span>
            <i className="ac-spot-key" />
            {t.ledSpots}
          </span>
        )}
      </p>
      <p className="ac-drawing-hint">{t.drawingHint}</p>
    </div>
  );
}
