"use client";
import { useEffect, useRef, type ReactNode } from "react";
import type { SystemKind } from "./types";
export type IconName =
  | "arrow"
  | "back"
  | "plus"
  | "close"
  | "check"
  | "cube"
  | "pin"
  | "document"
  | "help"
  | "sun"
  | "ruler"
  | "palette"
  | "settings"
  | "copy"
  | "trash"
  | "play"
  | "pause"
  | "reset"
  | "upload"
  | "image"
  | "exit"
  | "layers";
const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12 4 4L19 6" />,
  cube: (
    <>
      <path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9m-5-17 10 5" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 3m0 3h.01" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
    </>
  ),
  ruler: (
    <>
      <path d="m3 16 13-13 5 5L8 21zm7-7 3 3m-6 0 2 2m4-8 2 2" />
    </>
  ),
  palette: (
    <>
      <path d="M21 12c0 5-4 9-9 9-2 0-2-2-1-3 1-2-1-3-3-2-3 1-5-1-5-4a9 9 0 0 1 18 0Z" />
      <path d="M7 10h.01M10 6h.01M15 7h.01M17 12h.01" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="17" r="3" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V4H4v12h4" />
    </>
  ),
  trash: <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />,
  play: <path d="m8 5 11 7-11 7z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  reset: <path d="M4 11a8 8 0 1 1 1 6M4 4v7h7" />,
  upload: <path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1" />
      <path d="m3 16 5-5 5 5 3-3 5 5" />
    </>
  ),
  exit: <path d="M9 3H4v18h5M9 12h12m-5-5 5 5-5 5" />,
  layers: <path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 17l10 5 10-5" />,
};
export function CIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="ac-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Dialog({
  title,
  onClose,
  children,
  closeLabel,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="ac-dialog"
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ac-dialog-inner">
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            className="ac-icon-button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <CIcon name="close" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function SystemSketch({
  kind = "bioclimatic",
  large = false,
}: {
  kind?: SystemKind;
  large?: boolean;
}) {
  const vertical = [
    "runglass",
    "thermoglass",
    "tripleglass",
    "screenzip",
  ].includes(kind);
  return (
    <svg
      viewBox="0 0 220 165"
      className={large ? "ac-sketch ac-sketch-large" : "ac-sketch"}
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="113"
        cy="141"
        rx="91"
        ry="17"
        fill="currentColor"
        opacity=".04"
      />
      {vertical ? (
        <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
          <path
            d="M45 36 179 21v111L45 148z"
            fill="currentColor"
            fillOpacity=".05"
          />
          <path
            d={
              kind === "tripleglass"
                ? "M45 73 179 58M45 110 179 95"
                : "M89 31v111m45-116v111"
            }
          />
          <path d="m45 148-10-8V30l135-16 9 7" opacity=".4" />
          {kind === "screenzip" && (
            <path
              d="M45 42 179 27v67L45 110z"
              fill="currentColor"
              fillOpacity=".25"
            />
          )}
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
          <path
            d="m32 61 100-36 67 27-102 38z"
            fill="currentColor"
            fillOpacity=".06"
          />
          <path d="M32 61v68l7 3V66m58 24v60l7 3V91m95-39v64l-7 3V57M132 25v57l-7 3V30" />
          <path
            d="m32 61 65 29 102-38v9L98 98 32 69z"
            fill="currentColor"
            fillOpacity=".12"
          />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path
              key={i}
              d={`m${42 + i * 12} ${57 - i * 4.3} 61 25`}
              strokeWidth={kind === "bioclimatic" ? 5 : 1.4}
              opacity={kind === "bioclimatic" ? 0.65 : 0.35}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
