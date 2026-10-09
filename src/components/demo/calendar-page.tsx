"use client";
import { useState } from "react";
import Link from "next/link";
import { calendarEvents, monthDays, scenarioDate } from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import { useDemo } from "./demo-provider";
import { Panel, Empty } from "./ui";
import { PageHeader } from "../portal/page-header";
export function CalendarPage({ staff = false }: { staff?: boolean }) {
  const { data, dealerOrders, w, locale, text } = useDemo();
  const [month, setMonth] = useState(new Date(scenarioDate + "T00:00:00Z"));
  const orders = staff ? data.orders : dealerOrders,
    events = calendarEvents(orders, data.offers),
    upcoming = events.filter((e) => e.date >= scenarioDate),
    base = staff ? "/manager/orders/" : "/orders/";
  const days = monthDays(month.getUTCFullYear(), month.getUTCMonth());
  const title = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(month);
  const move = (n: number) =>
    setMonth(
      new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + n, 1)),
    );
  return (
    <>
      <PageHeader title={w.calendar} />
      <p className="scenario-date">
        {w.referenceDay}: {formatDate(scenarioDate, locale)}
      </p>
      <Panel>
        <div className="calendar-toolbar">
          <button
            className="button-secondary"
            aria-label={w.previousMonth}
            onClick={() => move(-1)}
          >
            ←
          </button>
          <h2 aria-live="polite">{title}</h2>
          <button
            className="button-secondary"
            aria-label={w.nextMonth}
            onClick={() => move(1)}
          >
            →
          </button>
        </div>
        <div className="month-grid" aria-label={title}>
          {days.slice(0, 7).map((d) => (
            <div key={d.toISOString()} className="weekday">
              {new Intl.DateTimeFormat(locale, {
                weekday: "short",
                timeZone: "UTC",
              }).format(d)}
            </div>
          ))}
          {days.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            return (
              <div
                key={iso}
                className={
                  "calendar-day " +
                  (d.getUTCMonth() !== month.getUTCMonth()
                    ? "muted-day "
                    : "") +
                  (iso === scenarioDate ? "is-today" : "")
                }
              >
                <time dateTime={iso}>{d.getUTCDate()}</time>
                {events
                  .filter((e) => e.date === iso)
                  .map((e) => (
                    <Link
                      key={e.id}
                      href={base + e.orderId}
                      className="calendar-event"
                      aria-label={
                        w[e.label] +
                        " · " +
                        e.orderId +
                        " · " +
                        formatDate(iso, locale)
                      }
                    >
                      <span className="event-label">
                        {w[e.label]}
                        <br />
                      </span>
                      {e.orderId.slice(-5)}
                    </Link>
                  ))}
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title={w.upcomingDates}>
        {upcoming.length ? (
          upcoming.map((e) => (
            <Link className="feed-row" key={e.id} href={base + e.orderId}>
              <span>
                {w[e.label]} ·{" "}
                {text(orders.find((o) => o.id === e.orderId)?.name ?? "")}
              </span>
              <small>
                {e.orderId} · {formatDate(e.date, locale)}
              </small>
            </Link>
          ))
        ) : (
          <Empty />
        )}
      </Panel>
    </>
  );
}
