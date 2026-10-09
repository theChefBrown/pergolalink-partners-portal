"use client";
import { useState } from "react";
import Link from "next/link";
import { orderStatuses, categories } from "@/lib/demo-types";
import { languages } from "@/lib/i18n";
import { useDemo } from "./demo-provider";
import { Panel, Field, Button, Empty } from "./ui";
import { Records } from "./records";
import { PageHeader } from "../portal/page-header";
export function AdminActivity() {
  const { data, w, locale } = useDemo(),
    [search, setSearch] = useState(""),
    [role, setRole] = useState("");
  const rows = data.activity
    .filter(
      (a) =>
        (!role || a.role === role) &&
        [a.user, a.orderId, w[a.action]]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(search.trim().toLocaleLowerCase(locale)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeader title={w.activity} />
      <Panel>
        <div className="form-grid">
          <Field label={w.search}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label={w.role}>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">{w.all}</option>
              {(["dealer", "manager", "admin"] as const).map((r) => (
                <option key={r} value={r}>
                  {
                    w[
                      r === "dealer"
                        ? "dealerRole"
                        : r === "manager"
                          ? "managerRole"
                          : "adminRole"
                    ]
                  }
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>
      <Panel>
        {rows.length ? (
          <Records
            headers={[w.user, w.role, w.action, w.orderNumber, w.date]}
            rows={rows.map((a) => ({
              id: a.id,
              cells: [
                a.user,
                w[
                  a.role === "dealer"
                    ? "dealerRole"
                    : a.role === "manager"
                      ? "managerRole"
                      : "adminRole"
                ],
                w[a.action],
                a.orderId ? (
                  <Link key="order" href={"/manager/orders/" + a.orderId}>
                    {a.orderId}
                  </Link>
                ) : (
                  w.noPrice
                ),
                new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Europe/Bucharest",
                }).format(new Date(a.date)),
              ],
            }))}
          />
        ) : (
          <Empty />
        )}
      </Panel>
    </>
  );
}
export function AdminSettings() {
  const { w, locale, setLocale, theme, toggleTheme } = useDemo();
  return (
    <>
      <PageHeader title={w.settings} />
      <Panel title={w.appSettings}>
        <div className="form-grid">
          <Field label={w.language}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-actions">
            <Button onClick={toggleTheme}>
              {theme === "dark" ? w.light : w.dark}
            </Button>
          </div>
        </div>
        <p className="scenario-date">{w.roleHint}</p>
      </Panel>
      <Panel title={w.orderStatuses}>
        <div className="settings-list">
          {orderStatuses.map((s) => (
            <span key={s}>{w[s]}</span>
          ))}
        </div>
      </Panel>
      <Panel title={w.productCategories}>
        <div className="settings-list">
          {categories.map((c) => (
            <span key={c}>{w[c]}</span>
          ))}
        </div>
      </Panel>
      <Panel title={w.notificationTypes}>
        <div className="settings-list">
          {(
            [
              "offerAvailable",
              "informationRequired",
              "production",
              "delayed",
              "pickupReady",
              "documentAdded",
            ] as const
          ).map((k) => (
            <span key={k}>{w[k]}</span>
          ))}
        </div>
      </Panel>
    </>
  );
}
