"use client";
import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useDemo } from "./demo-provider";
import { Panel, Field, Button, Empty, Badge } from "./ui";
import { PageHeader } from "../portal/page-header";
export function UpdatesPage({ requests = false }: { requests?: boolean }) {
  const { data, w, text, locale, commit } = useDemo(),
    [search, setSearch] = useState(""),
    [dealer, setDealer] = useState(""),
    [status, setStatus] = useState(requests ? "open" : "");
  const updates = data.updates
    .filter(
      (u) =>
        (!requests || (u.author === "dealer" && !u.internal)) &&
        (!status || (status === "resolved" ? u.resolved : !u.resolved)) &&
        (!dealer ||
          data.orders.find((o) => o.id === u.orderId)?.dealerId === dealer) &&
        [
          text(u.body),
          u.orderId,
          data.dealers.find(
            (d) =>
              d.id === data.orders.find((o) => o.id === u.orderId)?.dealerId,
          )?.name,
        ]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(search.trim().toLocaleLowerCase(locale)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeader title={requests ? w.requests : w.messages} />
      <Panel>
        <div className="filter-grid">
          <Field label={w.search}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label={w.dealers}>
            <select value={dealer} onChange={(e) => setDealer(e.target.value)}>
              <option value="">{w.all}</option>
              {data.dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={w.status}>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{w.all}</option>
              <option value="open">{w.actionRequired}</option>
              <option value="resolved">{w.resolved}</option>
            </select>
          </Field>
        </div>
      </Panel>
      <Panel>
        {updates.length ? (
          updates.map((u) => (
            <article
              key={u.id}
              className={u.internal ? "internal-block" : "public-block"}
            >
              <div className="message-head">
                <span>
                  {
                    data.dealers.find(
                      (d) =>
                        d.id ===
                        data.orders.find((o) => o.id === u.orderId)?.dealerId,
                    )?.name
                  }{" "}
                  ·{" "}
                  {
                    w[
                      u.author === "dealer"
                        ? "dealerRole"
                        : u.author === "manager"
                          ? "managerRole"
                          : "adminRole"
                    ]
                  }
                </span>
                <time>{formatDate(u.date, locale)}</time>
              </div>
              {u.internal && <Badge value="internalNote" />}
              <p className="message-body">{text(u.body)}</p>
              <div className="form-actions">
                <Link
                  className="button-secondary"
                  href={"/manager/orders/" + u.orderId}
                >
                  {u.orderId} →
                </Link>
                {u.author === "dealer" && (
                  <Button
                    onClick={() =>
                      commit(
                        "recordUpdated",
                        (s) => ({
                          ...s,
                          updates: s.updates.map((x) =>
                            x.id === u.id ? { ...x, resolved: !x.resolved } : x,
                          ),
                        }),
                        u.orderId,
                        true,
                      )
                    }
                  >
                    {u.resolved ? w.actionRequired : w.resolved}
                  </Button>
                )}
                {u.type === "requestOffer" && !u.resolved && (
                  <Link
                    className="button-secondary"
                    href={"/manager/offers/new?order=" + u.orderId}
                  >
                    {w.newOffer}
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <Empty />
        )}
      </Panel>
    </>
  );
}
