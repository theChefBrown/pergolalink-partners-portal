"use client";
/* eslint-disable @next/next/no-img-element -- Configuration snapshots are generated locally as data URLs. */
import { useState } from "react";
import Link from "next/link";
import { orderStatuses } from "@/lib/demo-types";
import { formatDate } from "@/lib/format";
import { useDemo } from "./demo-provider";
import { Back, Panel, Badge, Button } from "./ui";
import { PageHeader } from "../portal/page-header";
import { MissingPage } from "../missing-page";
import { DocumentCard } from "./documents";
import { OrderActionDialog, type OrderAction } from "./order-actions";
import { OrderCustomerOffer } from "./order-customer-offer";
import { systemRows } from "@/features/configurator/summary";
import { getCopy } from "@/features/configurator/locales";
import {
  priceRows,
  priceIssueLabel,
} from "@/features/configurator/price-summary";
export function OrderDetail({
  id,
  staff = false,
}: {
  id: string;
  staff?: boolean;
}) {
  const { data, w, text, locale, canViewOrder } = useDemo();
  const [action, setAction] = useState<OrderAction | null>(null);
  const order = data.orders.find((o) => o.id === id);
  if (!order || !canViewOrder(order, staff)) return <MissingPage />;
  const dealer = data.dealers.find((d) => d.id === order.dealerId);
  const updates = data.updates.filter(
    (m) => m.orderId === id && (staff || !m.internal),
  );
  const documents = data.documents.filter(
    (d) => d.orderId === id && !d.archived && (staff || d.visible),
  );
  const activities = data.activity.filter(
    (a) => a.orderId === id && (staff || !a.internal),
  );
  const progress = orderStatuses.filter(
    (s) =>
      !["informationRequired", "delayed", "onHold", "cancelled"].includes(s),
  );
  const index = progress.findIndex((s) => s === order.status);
  const actions: OrderAction[] = staff
    ? [
        "statusChanged",
        "delayed",
        "actionRequired",
        "sendMessage",
        "internalNote",
        "upload",
      ]
    : ["requestOffer", "requestChange", "sendInfo", "upload", "sendMessage"];
  return (
    <>
      <Back href={staff ? "/manager/orders" : "/orders"} />
      <PageHeader
        eyebrow={id}
        title={text(order.name)}
        action={<Badge value={order.status} />}
      />
      <div className="table-actions">
        {actions.map((a) => (
          <Button key={a} onClick={() => setAction(a)}>
            {w[a]}
          </Button>
        ))}
      </div>
      {order.delay && (
        <section className="warning-card">
          <h2>{w.delayed}</h2>
          <p>{text(order.delay.explanation)}</p>
          <small>
            {w.expectedDate}: {formatDate(order.delay.date, locale)}
          </small>
          {staff && (
            <div className="internal-block">
              <strong>{w.internalNote}</strong>
              <p>
                {typeof order.delay.internal === "string"
                  ? order.delay.internal
                  : text(order.delay.internal)}
              </p>
            </div>
          )}
        </section>
      )}
      {order.actionRequired && (
        <section className="warning-card">
          <h2>{w.actionRequired}</h2>
          <p>{text(order.actionRequired)}</p>
        </section>
      )}
      <Panel title={w.general}>
        <dl className="detail-grid">
          {[
            [w.orderNumber, id],
            [w.clientRef, order.clientRef],
            [w.location, order.city],
            ...(order.address
              ? [[getCopy(locale).address, order.address]]
              : []),
            ...(order.county ? [[getCopy(locale).county, order.county]] : []),
            [
              w.country,
              new Intl.DisplayNames(locale, { type: "region" }).of(
                order.country,
              ),
            ],
            [w.dealers, dealer?.name],
            [w.date, formatDate(order.createdAt, locale)],
            [w.updated, formatDate(order.updatedAt, locale)],
            [
              w.expectedDate,
              order.expectedDate
                ? formatDate(order.expectedDate, locale)
                : w.noPrice,
            ],
            [
              w.pickupDate,
              order.pickupDate
                ? formatDate(order.pickupDate, locale)
                : w.noPrice,
            ],
            [
              w.deliveryDate,
              order.deliveryDate
                ? formatDate(order.deliveryDate, locale)
                : w.noPrice,
            ],
            [
              w.installationEvent,
              order.installationDate
                ? formatDate(order.installationDate, locale)
                : w.noPrice,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || w.noPrice}</dd>
            </div>
          ))}
        </dl>
        {text(order.notes) && (
          <p className="message-body">{text(order.notes)}</p>
        )}
        {staff && (
          <div className="internal-block">
            <strong>{w.internalStatus}</strong>
            <p>{order.internalStatus || w.noPrice}</p>
          </div>
        )}
      </Panel>
      <Panel title={w.products}>
        <div className="detail-products">
          {order.items.map((i) => (
            <article className="detail-product" key={i.id}>
              <h3>
                {i.quantity} ×{" "}
                {text(
                  data.products.find((p) => p.id === i.productId)?.name ?? "",
                )}
              </h3>
              {i.preview && (
                <img
                  className="preview-image"
                  src={i.preview}
                  alt={i.model}
                  loading="lazy"
                />
              )}
              <dl className="detail-grid">
                {(i.configuration
                  ? systemRows(i.configuration, locale)
                  : [
                      [w.modelLabel, i.model],
                      [w.width, i.width],
                      [w.projection, i.projection],
                      [w.height, i.height],
                      [w.colour, i.colour],
                      [w.motor, i.motor],
                      [w.lighting, i.lighting ? w.yes : w.no],
                      [w.options, i.options],
                      [w.technicalNotes, i.notes],
                    ]
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || w.noPrice}</dd>
                  </div>
                ))}
              </dl>
              {order.pricing &&
                (() => {
                  const price = order.pricing.systems.find(
                    (p) => p.systemId === i.id,
                  );
                  return price ? (
                    <div className="order-price-summary">
                      <h4>{getCopy(locale).commercialSummary}</h4>
                      <dl className="detail-grid">
                        {priceRows(price, order.pricing!, locale).map(
                          ([label, value]) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd>{value}</dd>
                            </div>
                          ),
                        )}
                      </dl>
                      {price.issues.map((issue) => (
                        <p key={issue}>{priceIssueLabel(issue, locale)}</p>
                      ))}
                    </div>
                  ) : null;
                })()}
            </article>
          ))}
        </div>
      </Panel>
      {order.pricing && (
        <Panel title={getCopy(locale).commercialSummary}>
          <dl className="detail-grid">
            {priceRows(order.pricing, order.pricing, locale).map(
              ([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ),
            )}
          </dl>
          <p>
            {
              getCopy(locale)[
                order.pricing.tax === "excluded"
                  ? "taxExcluded"
                  : order.pricing.tax === "included"
                    ? "taxIncluded"
                    : "taxUnconfirmed"
              ]
            }
          </p>
          {order.pricing.status !== "complete" && (
            <p>{getCopy(locale).partialPricingHint}</p>
          )}
          <small>
            {getCopy(locale).priceVersion}: {order.pricing.policyVersion}
          </small>
        </Panel>
      )}
      <Panel title={w.statusTimeline}>
        <ol className="order-progress">
          {progress.map((s, n) => (
            <li
              key={s}
              className={
                (n <= index ? "passed " : "") +
                (s === order.status ? "current" : "")
              }
              aria-current={s === order.status ? "step" : undefined}
            >
              <span>{w[s]}</span>
            </li>
          ))}
        </ol>
        {index < 0 && <Badge value={order.status} />}
      </Panel>
      <Panel title={w.files}>
        {documents.length ? (
          <div className="file-grid">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <p>{w.noFiles}</p>
        )}
        {!staff && <OrderCustomerOffer order={order} />}
      </Panel>
      <Panel title={w.offersNav}>
        {data.offers
          .filter((o) => o.orderId === id && (staff || o.status !== "draft"))
          .map((o) => (
            <Link
              className="feed-row"
              href={(staff ? "/manager" : "") + "/offers/" + o.id}
              key={o.id}
            >
              {o.id}
              <Badge value={o.status} />
            </Link>
          ))}
      </Panel>
      <Panel title={w.messages}>
        {updates.map((m) => (
          <article
            key={m.id}
            className={m.internal ? "internal-block" : "public-block"}
          >
            <div className="message-head">
              <span>
                {
                  w[
                    m.author === "dealer"
                      ? "dealerRole"
                      : m.author === "manager"
                        ? "managerRole"
                        : "adminRole"
                  ]
                }{" "}
                · {m.internal ? w.internalNote : w.publicUpdate}
              </span>
              <time>{formatDate(m.date, locale)}</time>
            </div>
            <p className="message-body">{text(m.body)}</p>
          </article>
        ))}
      </Panel>
      <Panel title={w.activity}>
        {activities.map((a) => (
          <div className="feed-row" key={a.id}>
            <span>{w[a.action]}</span>
            <small>
              {a.user} · {formatDate(a.date, locale)}
            </small>
          </div>
        ))}
      </Panel>
      {action && (
        <OrderActionDialog
          key={action}
          order={order}
          action={action}
          onClose={() => setAction(null)}
        />
      )}
    </>
  );
}
