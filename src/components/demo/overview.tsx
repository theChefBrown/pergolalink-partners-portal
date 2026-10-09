"use client";
import Link from "next/link";
import { useDemo } from "./demo-provider";
import { PageHeader } from "../portal/page-header";
import { Panel, Badge, Empty } from "./ui";
import { Records } from "./records";
import { formatDate, formatNumber } from "@/lib/format";
import type { TextKey } from "@/lib/workflow-messages";
import { calendarEvents, scenarioDate } from "@/lib/calendar";
export function Overview({
  staff = false,
  admin = false,
}: {
  staff?: boolean;
  admin?: boolean;
}) {
  const { data, dealerOrders, w, text, locale } = useDemo();
  const orders = staff ? data.orders : dealerOrders,
    ids = new Set(orders.map((o) => o.id));
  const base = staff ? "/manager" : "";
  const offers = data.offers.filter((o) => ids.has(o.orderId));
  const notifications = data.notifications.filter((n) => ids.has(n.orderId));
  const attention = orders.filter(
    (o) => o.actionRequired || o.status === "delayed",
  );
  const metrics: [TextKey, number][] = admin
    ? [
        ["users", data.users.length],
        ["dealers", data.dealers.length],
        ["products", data.products.length],
        [
          "activeOrders",
          orders.filter((o) => !["completed", "cancelled"].includes(o.status))
            .length,
        ],
        ["offersNav", offers.length],
        ["documentation", data.documents.filter((d) => !d.archived).length],
      ]
    : staff
      ? [
          [
            "requests",
            data.updates.filter(
              (u) => u.author === "dealer" && !u.resolved && !u.internal,
            ).length,
          ],
          [
            "underReview",
            orders.filter(
              (o) => o.status === "review" || o.status === "submitted",
            ).length,
          ],
          [
            "offersPrepare",
            offers.filter(
              (o) =>
                o.status === "draft" || o.status === "modificationRequested",
            ).length,
          ],
          [
            "inProduction",
            orders.filter((o) => o.status === "production").length,
          ],
          ["delayed", orders.filter((o) => o.status === "delayed").length],
          [
            "pickupReady",
            orders.filter((o) => o.status === "pickupReady").length,
          ],
        ]
      : [
          [
            "activeOrders",
            orders.filter((o) => !["completed", "cancelled"].includes(o.status))
              .length,
          ],
          [
            "underReview",
            orders.filter((o) =>
              ["review", "informationRequired", "submitted"].includes(o.status),
            ).length,
          ],
          [
            "offerAvailable",
            offers.filter((o) =>
              ["offerAvailable", "awaitingApproval"].includes(o.status),
            ).length,
          ],
          [
            "inProduction",
            orders.filter((o) => o.status === "production").length,
          ],
          [
            "pickupReady",
            orders.filter((o) => o.status === "pickupReady").length,
          ],
          ["completed", orders.filter((o) => o.status === "completed").length],
        ];
  const recent = [...orders]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);
  const dates = calendarEvents(orders, data.offers)
    .filter((e) => e.date >= scenarioDate)
    .slice(0, 4);
  const updates = data.updates
    .filter((u) => ids.has(u.orderId) && (staff || !u.internal))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  return (
    <>
      <PageHeader
        eyebrow={
          staff
            ? "PergolaLink"
            : data.dealers.find((d) => d.id === orders[0]?.dealerId)?.name
        }
        title={admin ? w.adminPanel : staff ? w.managerPanel : w.dashboard}
        description={w.dashboardIntro}
        action={
          !staff && (
            <Link href="/orders/new" className="button-primary">
              {w.newOrder}
            </Link>
          )
        }
      />
      <p className="scenario-date">
        {w.referenceDay}: {formatDate(scenarioDate, locale)}
      </p>
      <div className="metrics-grid">
        {metrics.map(([key, n]) => (
          <article className="metric-card" key={key}>
            <span>{w[key]}</span>
            <strong>{formatNumber(n, locale)}</strong>
          </article>
        ))}
      </div>
      {attention.length > 0 && (
        <Panel title={w.urgent}>
          <div className="attention-list">
            {attention.map((o) => (
              <Link key={o.id} href={base + "/orders/" + o.id}>
                <strong>{o.id}</strong>
                <span>
                  {o.actionRequired ? text(o.actionRequired) : w.delayed}
                </span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </Panel>
      )}
      <Panel
        title={w.recentOrders}
        action={<Link href={base + "/orders"}>{w.viewAll} →</Link>}
      >
        {recent.length ? (
          <Records
            headers={[w.orderNumber, w.projectName, w.status, w.updated]}
            rows={recent.map((o) => ({
              id: o.id,
              cells: [
                <Link key="id" href={base + "/orders/" + o.id}>
                  {o.id}
                </Link>,
                text(o.name),
                <Badge key="s" value={o.status} />,
                formatDate(o.updatedAt, locale),
              ],
            }))}
          />
        ) : (
          <Empty />
        )}
      </Panel>
      <div className="dashboard-activity-grid">
        <Panel title={staff ? w.activity : w.notifications}>
          {(staff
            ? data.activity
                .filter((a) => a.orderId && ids.has(a.orderId))
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 4)
            : notifications.slice(0, 4)
          ).map((n) => (
            <Link
              className="feed-row"
              key={n.id}
              href={base + "/orders/" + n.orderId}
            >
              <span>{"text" in n ? text(n.text) : w[n.action]}</span>
              <small>
                {n.orderId} · {formatDate(n.date, locale)}
              </small>
            </Link>
          ))}
        </Panel>
        <Panel title={w.upcomingDates}>
          {dates.map((e) => (
            <Link
              className="feed-row"
              key={e.id}
              href={base + "/orders/" + e.orderId}
            >
              <span>{w[e.label]}</span>
              <small>
                {e.orderId} · {formatDate(e.date, locale)}
              </small>
            </Link>
          ))}
        </Panel>
      </div>
      <Panel title={w.messages}>
        {updates.map((u) => (
          <Link
            key={u.id}
            className="feed-row"
            href={base + "/orders/" + u.orderId}
          >
            <span>{text(u.body)}</span>
            <small>
              {u.internal ? w.internalNote : w.publicUpdate} · {u.orderId} ·{" "}
              {formatDate(u.date, locale)}
            </small>
          </Link>
        ))}
      </Panel>
    </>
  );
}
