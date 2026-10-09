import type { CSSProperties } from "react";

const paths = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  diagonal: "M6 18 18 6M6 6h12v12",
  sun: "M12 3V1m0 22v-2M3 12H1m22 0h-2M4.2 4.2 2.8 2.8m18.4 18.4-1.4-1.4M4.2 19.8l-1.4 1.4M21.2 2.8l-1.4 1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
  moon: "M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  document: "M14 2H5v20h14V7l-5-5Zm0 0v5h5M8 12h8m-8 4h6",
  layers: "m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  chevron: "m6 9 6 6 6-6",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 11h16",
  bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4",
  company: "M4 21V3h12v18M2 21h20m-6-10h4v10M8 7h4m-4 4h4m-4 4h4",
  plus: "M12 5v14M5 12h14",
  menu: "M4 6h16M4 12h16M4 18h16",
  shield: "m12 2 8 3v6c0 5-8 11-8 11S4 16 4 11V5l8-3Zm-4 9 3 3 5-6",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className, style }: { name: keyof typeof paths; className?: string; style?: CSSProperties }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      <path d={paths[name]} />
    </svg>
  );
}
