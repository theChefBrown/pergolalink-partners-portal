"use client";
import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Brand, ThemeToggle } from "@/components/site-controls";
import { MissingPage } from "@/components/missing-page";
import { PortalShell } from "@/components/portal/portal-shell";
import { DemoRouter } from "@/components/demo/demo-router";
import { portalRoutePattern } from "@/lib/portal-routes";

/**
 * GitHub Pages serves 404.html for paths that were not pre-rendered, such as orders
 * created in the browser. Render the portal client-side for any valid portal route.
 */
export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const segments = pathname.split("/").filter(Boolean);
  const route = segments.join("/");
  const legacy = segments[0] === "projects";

  useEffect(() => {
    if (mounted && legacy)
      router.replace("/orders" + (segments.length > 1 ? "/" + segments.slice(1).join("/") : ""));
  }, [mounted, legacy, router, segments]);

  if (!mounted || legacy) return null;
  if (portalRoutePattern.test(route))
    return (
      <PortalShell>
        <Suspense>
          <DemoRouter key={route} path={segments} />
        </Suspense>
      </PortalShell>
    );
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="page-container portal-header">
          <Brand />
          <ThemeToggle />
        </div>
      </header>
      <main className="page-container not-found-page">
        <MissingPage />
      </main>
    </div>
  );
}
