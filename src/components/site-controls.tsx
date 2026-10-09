"use client";
/* eslint-disable @next/next/no-img-element -- Small local logo assets also travel with the reusable configurator. */

import Link from "next/link";
import { useDisplayPreferences } from "./display-preferences";
import { Icon } from "./icon";
import { withBasePath } from "@/lib/base-path";

export function Brand({ href = "/" }: { href?: string }) {
  const { t, ui } = useDisplayPreferences();
  return (
    <Link href={href} className="brand" aria-label={`PergolaLink — ${ui.home}`}>
      <span className="brand-art" aria-hidden="true">
        <img
          className="brand-art-light"
          src={withBasePath("/configurator/pergolalink-logo-light.svg")}
          alt=""
          width={1600}
          height={408}
        />
        <img
          className="brand-art-dark"
          src={withBasePath("/configurator/pergolalink-logo-dark.svg")}
          alt=""
          width={1600}
          height={408}
        />
      </span>
      <span className="brand-caption">{t.portal}</span>
    </Link>
  );
}

export function ThemeToggle() {
  const { t, theme, toggleTheme } = useDisplayPreferences();
  const label = theme === "dark" ? t.light : t.dark;
  return (
    <button
      className="icon-button theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}

export function SiteFooter() {
  const { t } = useDisplayPreferences();
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <span>
          © 2026 <strong>Chef Brown · PergolaLink</strong>. All rights reserved.
        </span>
        <span className="footer-tagline">{t.footer}</span>
        <span className="footer-credit">
          {t.developedBy}{" "}
          <a href="https://thechefbrown.github.io/" target="_blank" rel="noopener noreferrer">Chef Brown</a>
        </span>
      </div>
    </footer>
  );
}
