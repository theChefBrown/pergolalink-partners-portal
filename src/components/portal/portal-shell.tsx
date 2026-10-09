"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Brand, ThemeToggle } from "../site-controls";
import { Icon, type IconName } from "../icon";
import { useDemo } from "../demo/demo-provider";
import type { DemoRole } from "@/lib/demo-types";
import type { TextKey } from "@/lib/workflow-messages";
import { demoCopy } from "@/lib/demo-copy";

type NavItem = { href: string; label: TextKey; icon: IconName };
const dealerNav: NavItem[] = [
  { href: "/dashboard", label: "dashboard", icon: "grid" },
  { href: "/orders", label: "myOrders", icon: "layers" },
  { href: "/orders/new", label: "newOrder", icon: "plus" },
  { href: "/offers", label: "offersNav", icon: "document" },
  { href: "/calendar", label: "calendar", icon: "calendar" },
  { href: "/documentation", label: "documentation", icon: "document" },
  { href: "/notifications", label: "notifications", icon: "bell" },
  { href: "/company", label: "company", icon: "company" },
];
const managerNav: NavItem[] = [
  { href: "/manager", label: "dashboard", icon: "grid" },
  { href: "/manager/dealers", label: "dealers", icon: "company" },
  { href: "/manager/orders", label: "orders", icon: "layers" },
  { href: "/manager/requests", label: "requests", icon: "bell" },
  { href: "/manager/offers", label: "offersNav", icon: "document" },
  { href: "/manager/calendar", label: "calendar", icon: "calendar" },
  { href: "/manager/updates", label: "messages", icon: "document" },
  { href: "/manager/documentation", label: "documentation", icon: "document" },
];
const adminNav: NavItem[] = [
  { href: "/admin", label: "overview", icon: "grid" },
  { href: "/admin/users", label: "users", icon: "company" },
  { href: "/admin/dealers", label: "dealers", icon: "company" },
  { href: "/admin/products", label: "products", icon: "layers" },
  { href: "/manager/orders", label: "orders", icon: "layers" },
  { href: "/manager/offers", label: "offersNav", icon: "document" },
  { href: "/admin/documentation", label: "documentation", icon: "document" },
  { href: "/admin/activity", label: "activity", icon: "document" },
  { href: "/admin/settings", label: "settings", icon: "grid" },
];
function Navigation({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const { w } = useDemo();
  const path = usePathname();
  return (
    <nav className="portal-navigation" aria-label={w.navigation}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={
            path === item.href ||
            (!["/dashboard", "/manager", "/admin", "/orders/new"].includes(
              item.href,
            ) &&
              path.startsWith(item.href + "/") &&
              !(item.href === "/orders" && path === "/orders/new"))
              ? "page"
              : undefined
          }
        >
          <Icon name={item.icon} />
          <span>{w[item.label]}</span>
        </Link>
      ))}
    </nav>
  );
}
export function PortalShell({ children }: { children: ReactNode }) {
  const {
    w,
    role,
    setRole,
    data,
    dealerId,
    setDealerId,
    resetDemo,
    storageUnavailable,
    locale,
    notice,
    clearNotice,
  } = useDemo();
  const demo = demoCopy(locale);
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const admin = path.startsWith("/admin"),
    manager = path.startsWith("/manager"),
    staff = admin || manager;
  const items = admin ? adminNav : manager ? managerNav : dealerNav;
  const area = admin ? w.adminPanel : manager ? w.managerPanel : w.dealerArea;
  const denied = (admin && role !== "admin") || (manager && role === "dealer");
  function switchRole(value: DemoRole) {
    setRole(value);
    setMenuOpen(false);
    clearNotice();
    router.push(
      value === "dealer"
        ? "/dashboard"
        : value === "manager"
          ? "/manager"
          : "/admin",
    );
  }
  if (path === "/orders/new") {
    return (
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    );
  }
  return (
    <div className="site-shell portal-shell">
      <a className="skip-link" href="#main">
        {w.skip}
      </a>
      <header className="site-header">
        <div className="page-container portal-header">
          <Brand />
          <div className="portal-header-tools">
            <label className="role-switcher">
              {w.viewAs}
              <select
                value={role}
                onChange={(e) => switchRole(e.target.value as DemoRole)}
                aria-label={w.viewAs}
              >
                <option value="dealer">{w.dealerRole}</option>
                <option value="manager">{w.managerRole}</option>
                <option value="admin">{w.adminRole}</option>
              </select>
            </label>
            <ThemeToggle />
          </div>
        </div>
        <details
          className="page-container portal-mobile-menu"
          open={menuOpen}
          onToggle={(e) => setMenuOpen(e.currentTarget.open)}
        >
          <summary>
            <Icon name={menuOpen ? "close" : "menu"} />
            {menuOpen ? w.menuClose : w.menuOpen}
            <Icon name="chevron" />
          </summary>
          <Navigation items={items} onNavigate={() => setMenuOpen(false)} />
        </details>
      </header>
      <div className="page-container portal-frame">
        <aside className="portal-sidebar">
          <p className="eyebrow">{area}</p>
          <Navigation items={items} />
          <div className="sidebar-bottom">
            {role === "admin" && (
              <div className="view-links">
                <Link href="/dashboard">{w.dealerArea}</Link>
                <Link href="/manager">{w.managerPanel}</Link>
                <Link href="/admin">{w.adminPanel}</Link>
              </div>
            )}
            <p>{w.sidebarHint}</p>
            <div className="demo-user">
              <span className="user-avatar">DP</span>
              <div>
                <strong>
                  {staff
                    ? "PergolaLink"
                    : data.dealers.find((d) => d.id === dealerId)?.name}
                </strong>
                <small>
                  {
                    w[
                      role === "dealer"
                        ? "dealerRole"
                        : role === "manager"
                          ? "managerRole"
                          : "adminRole"
                    ]
                  }
                </small>
              </div>
            </div>
          </div>
        </aside>
        <main id="main" className="portal-main" tabIndex={-1}>
          <div className="demo-notice">
            <span className="status-dot" />
            <p>
              {demo.banner} · {storageUnavailable ? demo.storage : demo.saved}
            </p>
          </div>
          <div className="demo-session-tools">
            <label className="role-switcher">
              {demo.dealer}
              <select
                aria-label={demo.dealer}
                value={dealerId}
                onChange={(e) => {
                  setDealerId(e.target.value);
                  clearNotice();
                  if (!staff) router.push("/dashboard");
                }}
              >
                {data.dealers
                  .filter((d) => d.active)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                if (window.confirm(demo.confirm)) {
                  resetDemo();
                  router.push("/dashboard");
                }
              }}
            >
              {demo.reset}
            </button>
          </div>
          {role === "admin" && (
            <div className="mobile-view-links view-links">
              <Link href="/dashboard">{w.dealerArea}</Link>
              <Link href="/manager">{w.managerPanel}</Link>
              <Link href="/admin">{w.adminPanel}</Link>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <span>{w[notice]}</span>
              <button
                type="button"
                className="icon-button"
                aria-label={w.closeDialog}
                onClick={clearNotice}
              >
                <Icon name="close" />
              </button>
            </div>
          )}
          {denied ? (
            <section className="section-preview portal-panel">
              <h1>{area}</h1>
              <p>{w.accessRole}</p>
            </section>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
