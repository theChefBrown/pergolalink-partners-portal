"use client";
import Link from "next/link";
import { useState } from "react";
import { orderStatuses } from "@/lib/demo-types";
import { formatDate } from "@/lib/format";
import { useDemo } from "./demo-provider";
import { Field, Panel, Button, Empty, Badge } from "./ui";
import { Records } from "./records";
import { PageHeader } from "../portal/page-header";
export function OrderList({
  staff = false,
  dealerFilter,
}: {
  staff?: boolean;
  dealerFilter?: string;
}) {
  const { data, dealerOrders, w, text, locale } = useDemo();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [product, setProduct] = useState(""),
    [dealer, setDealer] = useState(dealerFilter ?? ""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [sort, setSort] = useState("newest"),
    [attention, setAttention] = useState(false);
  const source = staff ? data.orders : dealerOrders;
  const query = search.trim().toLocaleLowerCase(locale);
  const invalidRange = Boolean(from && to && from > to);
  const rows = (
    invalidRange
      ? []
      : source.filter(
          (o) =>
            (!dealer || o.dealerId === dealer) &&
            (!status || o.status === status) &&
            (!product || o.items.some((i) => i.productId === product)) &&
            (!from || o.createdAt >= from) &&
            (!to || o.createdAt <= to) &&
            (!attention || o.status === "delayed" || o.actionRequired) &&
            (!query ||
              [
                o.id,
                text(o.name),
                o.city,
                data.dealers.find((d) => d.id === o.dealerId)?.name,
              ]
                .join(" ")
                .toLocaleLowerCase(locale)
                .includes(query)),
        )
  ).sort((a, b) =>
    sort === "nameSort"
      ? text(a.name).localeCompare(text(b.name), locale)
      : sort === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
  );
  const base = staff ? "/manager/orders" : "/orders";
  return (
    <>
      <PageHeader
        title={staff ? w.orders : w.myOrders}
        action={
          !staff && (
            <Link className="button-primary" href="/orders/new">
              {w.newOrder}
            </Link>
          )
        }
      />
      <Panel>
        <div className="filter-grid">
          <Field label={w.search}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label={w.status}>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{w.all}</option>
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {w[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={w.product}>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              <option value="">{w.all}</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {text(p.name)}
                </option>
              ))}
            </select>
          </Field>
          {staff && (
            <Field label={w.dealers}>
              <select
                value={dealer}
                onChange={(e) => setDealer(e.target.value)}
              >
                <option value="">{w.all}</option>
                {data.dealers.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={w.fromDate}>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label={w.toDate}>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          <Field label={w.sort}>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {(["newest", "oldest", "nameSort"] as const).map((s) => (
                <option key={s} value={s}>
                  {w[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form-actions">
          {staff && (
            <label className="check-field">
              <input
                type="checkbox"
                checked={attention}
                onChange={(e) => setAttention(e.target.checked)}
              />
              {w.urgent}
            </label>
          )}
          <Button
            onClick={() => {
              setSearch("");
              setStatus("");
              setProduct("");
              setDealer(dealerFilter ?? "");
              setFrom("");
              setTo("");
              setSort("newest");
              setAttention(false);
            }}
          >
            {w.reset}
          </Button>
        </div>
        {invalidRange && (
          <p role="alert" className="form-error">
            {w.invalidRange}
          </p>
        )}
      </Panel>
      <Panel>
        {rows.length ? (
          <Records
            headers={[
              w.orderNumber,
              w.projectName,
              ...(staff ? [w.dealers] : []),
              w.location,
              w.products,
              w.status,
              w.date,
              w.updated,
            ]}
            rows={rows.map((o) => ({
              id: o.id,
              cells: [
                <Link href={base + "/" + o.id} key="id">
                  {o.id}
                </Link>,
                <Link href={base + "/" + o.id} key="name">
                  {text(o.name)}
                </Link>,
                ...(staff
                  ? [data.dealers.find((d) => d.id === o.dealerId)?.name]
                  : []),
                o.city,
                o.items
                  .map(
                    (i) =>
                      i.quantity +
                      " × " +
                      text(
                        data.products.find((p) => p.id === i.productId)?.name ??
                          "",
                      ),
                  )
                  .join(", "),
                <span key="status">
                  <Badge value={o.status} />
                  {o.actionRequired && (
                    <span className="attention-label">{w.actionRequired}</span>
                  )}
                </span>,
                formatDate(o.createdAt, locale),
                formatDate(o.updatedAt, locale),
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
