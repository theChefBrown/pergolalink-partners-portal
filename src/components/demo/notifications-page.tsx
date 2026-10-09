"use client";
import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useDemo } from "./demo-provider";
import { Panel, Field, Button, Empty, Badge } from "./ui";
import { PageHeader } from "../portal/page-header";
export function NotificationsPage() {
  const { w, data, dealerOrders, text, locale, commit } = useDemo(),
    [filter, setFilter] = useState("");
  const ids = new Set(dealerOrders.map((o) => o.id));
  const own = data.notifications.filter((n) => ids.has(n.orderId)),
    rows = own
      .filter((n) => !filter || (filter === "read" ? n.read : !n.read))
      .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeader
        title={w.notifications}
        action={
          <Button
            disabled={own.every((n) => n.read)}
            onClick={() =>
              commit(
                "recordUpdated",
                (s) => ({
                  ...s,
                  notifications: s.notifications.map((n) =>
                    ids.has(n.orderId) ? { ...n, read: true } : n,
                  ),
                }),
                undefined,
                true,
              )
            }
          >
            {w.markAllRead}
          </Button>
        }
      />
      <Panel>
        <Field label={w.status}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">{w.all}</option>
            <option value="unread">{w.unread}</option>
            <option value="read">{w.read}</option>
          </select>
        </Field>
        {rows.length ? (
          rows.map((n) => (
            <article
              key={n.id}
              className={"notification-row " + (!n.read ? "is-unread" : "")}
            >
              <div>
                <p>{text(n.text)}</p>
                <small>
                  <Link href={"/orders/" + n.orderId}>{n.orderId}</Link> ·{" "}
                  {formatDate(n.date, locale)}
                </small>
                <Badge value={n.read ? "read" : "unread"} />
              </div>
              <Button
                onClick={() =>
                  commit(
                    "recordUpdated",
                    (s) => ({
                      ...s,
                      notifications: s.notifications.map((x) =>
                        x.id === n.id ? { ...x, read: !x.read } : x,
                      ),
                    }),
                    undefined,
                    true,
                  )
                }
              >
                {n.read ? w.markUnread : w.markRead}
              </Button>
            </article>
          ))
        ) : (
          <Empty />
        )}
      </Panel>
    </>
  );
}
