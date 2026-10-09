"use client";

import Link from "next/link";
import { useDisplayPreferences } from "./display-preferences";
import { PageHeader } from "./portal/page-header";

export function MissingPage() {
  const { ui } = useDisplayPreferences();
  return <section className="missing-page"><PageHeader eyebrow="404" title={ui.notFound} description={ui.notFoundBody} /><Link className="button-primary" href="/">{ui.backHome}</Link></section>;
}
