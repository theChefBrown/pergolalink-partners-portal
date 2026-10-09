"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Offer, OfferItem, OfferStatus } from "@/lib/demo-types";
import { offerStatuses } from "@/lib/demo-types";
import { formatDate } from "@/lib/format";
import { useDemo } from "./demo-provider";
import {
  Panel,
  Field,
  Button,
  Back,
  Badge,
  Empty,
  Modal,
  FormError,
  validForm,
} from "./ui";
import { Records } from "./records";
import { PageHeader } from "../portal/page-header";
import { MissingPage } from "../missing-page";
import { changeOffer } from "@/lib/offer-transitions";
import type { DemoText } from "@/lib/workflow-messages";
import { demoDate } from "@/lib/demo-date";
export function OfferList({ staff = false }: { staff?: boolean }) {
  const { w, data, dealerOrders, text, locale } = useDemo();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const ids = new Set((staff ? data.orders : dealerOrders).map((o) => o.id));
  const offers = data.offers.filter(
    (o) =>
      ids.has(o.orderId) &&
      (staff || o.status !== "draft") &&
      (!status || o.status === status) &&
      (!search ||
        [
          o.id,
          o.orderId,
          text(data.orders.find((r) => r.id === o.orderId)?.name ?? ""),
        ]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(search.toLocaleLowerCase(locale))),
  );
  const base = (staff ? "/manager" : "") + "/offers";
  return (
    <>
      <PageHeader
        title={w.offersNav}
        action={
          staff && (
            <Link className="button-primary" href={base + "/new"}>
              {w.newOffer}
            </Link>
          )
        }
      />
      <Panel>
        <div className="form-grid">
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
              {offerStatuses
                .filter((s) => staff || s !== "draft")
                .map((s) => (
                  <option key={s} value={s}>
                    {w[s]}
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </Panel>
      <Panel>
        {offers.length ? (
          <Records
            headers={[
              w.offerNumber,
              w.orderNumber,
              w.projectName,
              ...(staff ? [w.dealers] : []),
              w.date,
              w.revision,
              w.status,
            ]}
            rows={offers.map((o) => ({
              id: o.id,
              cells: [
                <Link href={base + "/" + o.id} key="id">
                  {o.id}
                </Link>,
                o.orderId,
                text(data.orders.find((r) => r.id === o.orderId)?.name ?? ""),
                ...(staff
                  ? [
                      data.dealers.find(
                        (d) =>
                          d.id ===
                          data.orders.find((r) => r.id === o.orderId)?.dealerId,
                      )?.name,
                    ]
                  : []),
                formatDate(o.date, locale),
                o.revision,
                <Badge value={o.status} key="status" />,
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
export function OfferDetail({
  id,
  staff = false,
}: {
  id: string;
  staff?: boolean;
}) {
  const { w, data, role, text, locale, canViewOrder, commit } = useDemo();
  const [dialog, setDialog] = useState<"accept" | "modify" | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false),
    [exportError, setExportError] = useState(false);
  const offer = data.offers.find((o) => o.id === id),
    order = data.orders.find((o) => o.id === offer?.orderId);
  if (
    !offer ||
    !order ||
    !canViewOrder(order, staff) ||
    (!staff && offer.status === "draft")
  )
    return <MissingPage />;
  const expired = offer.status === "expired" || offer.validUntil < demoDate(),
    actionable =
      ["offerAvailable", "awaitingApproval", "modificationRequested"].includes(
        offer.status,
      ) && !expired;
  function change(status: OfferStatus) {
    const now = new Date().toISOString();
    const eventId = crypto.randomUUID();
    commit(
      status === "accepted" ? "offerAccepted" : "offerSaved",
      (s) => changeOffer(s, id, status, { role, message, date: now, eventId }),
      order!.id,
    );
    setDialog(null);
  }
  return (
    <>
      <Back href={staff ? "/manager/offers" : "/offers"} />
      <PageHeader
        title={offer.id}
        description={text(order.name)}
        action={<Badge value={expired ? "expired" : offer.status} />}
      />
      <div className="table-actions">
        <Button
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            setExportError(false);
            try {
              const { offerReport } = await import("@/lib/offer-report");
              const file = await offerReport(offer, order, locale, text),
                url = URL.createObjectURL(file),
                link = document.createElement("a");
              link.href = url;
              link.download = file.name;
              document.body.appendChild(link);
              link.click();
              link.remove();
              setTimeout(() => URL.revokeObjectURL(url), 60000);
            } catch {
              setExportError(true);
            } finally {
              setExporting(false);
            }
          }}
        >
          {w.downloadPdf}
        </Button>
        {staff && (
          <>
            <Link
              className="button-secondary"
              href={"/manager/offers/" + id + "/edit"}
            >
              {w.edit}
            </Link>
            <Link
              className="button-secondary"
              href={"/manager/offers/" + id + "/revision"}
            >
              {w.newRevision}
            </Link>
          </>
        )}
        {!staff && actionable && (
          <>
            <Button onClick={() => setDialog("accept")}>{w.acceptOffer}</Button>
            <Button onClick={() => setDialog("modify")}>
              {w.requestChange}
            </Button>
          </>
        )}
        {staff && offer.status === "draft" && (
          <Button onClick={() => change("offerAvailable")}>
            {w.sendOffer}
          </Button>
        )}
      </div>
      {exportError && <p role="alert">{w.fileInvalid}</p>}
      <Panel title={w.general}>
        <dl className="detail-grid">
          <div>
            <dt>{w.orderNumber}</dt>
            <dd>
              <Link href={(staff ? "/manager" : "") + "/orders/" + order.id}>
                {order.id} →
              </Link>
            </dd>
          </div>
          <div>
            <dt>{w.date}</dt>
            <dd>{formatDate(offer.date, locale)}</dd>
          </div>
          <div>
            <dt>{w.validUntil}</dt>
            <dd>{formatDate(offer.validUntil, locale)}</dd>
          </div>
          <div>
            <dt>{w.revision}</dt>
            <dd>{offer.revision}</dd>
          </div>
        </dl>
      </Panel>
      <Panel title={w.products}>
        <Records
          headers={[w.description, w.quantity, w.price]}
          rows={offer.items.map((i) => ({
            id: i.id,
            cells: [
              text(i.description),
              i.quantity,
              i.price
                ? new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: "EUR",
                  }).format(Number(i.price))
                : w.noPrice,
            ],
          }))}
        />
        <p className="message-body">{text(offer.notes)}</p>
        <p className="scenario-date">{w.sampleDocument}</p>
      </Panel>
      {dialog && (
        <Modal
          title={dialog === "accept" ? w.acceptOffer : w.requestChange}
          onClose={() => setDialog(null)}
        >
          <form
            noValidate
            onSubmit={(e) => {
              if (!validForm(e) || (dialog === "modify" && !message.trim())) {
                setError(true);
                return;
              }
              change(
                dialog === "accept" ? "accepted" : "modificationRequested",
              );
            }}
          >
            {dialog === "accept" ? (
              <p>{w.confirmAccept}</p>
            ) : (
              <Field label={w.message}>
                <textarea
                  required
                  maxLength={4000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Field>
            )}
            <FormError show={error} />
            <div className="form-actions">
              <Button onClick={() => setDialog(null)}>{w.cancel}</Button>
              <button className="button-primary" type="submit">
                {w.confirm}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function OfferEditor({
  id,
  revision = false,
  initialOrderId,
}: {
  id?: string;
  revision?: boolean;
  initialOrderId?: string;
}) {
  const { w, data, text, commit } = useDemo(),
    router = useRouter();
  const original = data.offers.find((o) => o.id === id);
  const [orderId, setOrderId] = useState(
      original?.orderId ??
        data.orders.find((o) => o.id === initialOrderId)?.id ??
        data.orders[0]?.id ??
        "",
    ),
    [notes, setNotes] = useState<DemoText>(original?.notes ?? ""),
    [validUntil, setValidUntil] = useState(
      original?.validUntil ?? demoDate(30),
    ),
    [error, setError] = useState(false);
  const mapOrder = (orderId: string): OfferItem[] =>
    (data.orders.find((o) => o.id === orderId)?.items ?? []).map((i, n) => ({
      id: "item-" + n,
      description: data.products.find((p) => p.id === i.productId)?.name ?? "",
      quantity: i.quantity,
      price: "",
    }));
  const [items, setItems] = useState<OfferItem[]>(
    original?.items ?? mapOrder(orderId),
  );
  if (id && !original) return <MissingPage />;
  const update = (id: string, values: Partial<OfferItem>) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...values } : i)));
  return (
    <>
      <Back href="/manager/offers" />
      <PageHeader title={revision ? w.newRevision : w.offerEditor} />
      <Panel>
        <form
          noValidate
          onSubmit={(e) => {
            if (
              !validForm(e) ||
              !items.length ||
              items.some((i) => !text(i.description).trim())
            ) {
              setError(true);
              return;
            }
            const now = new Date().toISOString(),
              newId =
                original && !revision
                  ? original.id
                  : "OFF-" + crypto.randomUUID().slice(0, 8).toUpperCase();
            const next: Offer = {
              id: newId,
              orderId,
              date: now.slice(0, 10),
              validUntil,
              revision: revision
                ? Math.max(
                    0,
                    ...data.offers
                      .filter((o) => o.orderId === orderId)
                      .map((o) => o.revision),
                  ) + 1
                : (original?.revision ?? 1),
              status: "draft",
              items,
              notes,
            };
            commit(
              "offerSaved",
              (s) => ({
                ...s,
                offers:
                  original && !revision
                    ? s.offers.map((o) => (o.id === newId ? next : o))
                    : [next, ...s.offers],
              }),
              orderId,
            );
            router.push("/manager/offers/" + newId);
          }}
        >
          <div className="form-grid">
            <Field label={w.orders}>
              <select
                required
                value={orderId}
                disabled={Boolean(original)}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setItems(mapOrder(e.target.value));
                }}
              >
                {data.orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} · {text(o.name)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={w.validUntil}>
              <input
                type="date"
                required
                min={demoDate()}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </Field>
          </div>
          {items.map((i, n) => (
            <section className="product-form" key={i.id}>
              <div className="product-form-heading">
                {w.product} {n + 1}
                <Button
                  disabled={items.length === 1}
                  onClick={() => setItems(items.filter((x) => x.id !== i.id))}
                >
                  {w.remove}
                </Button>
              </div>
              <div className="form-grid">
                <Field label={w.description}>
                  <input
                    required
                    value={text(i.description)}
                    onChange={(e) =>
                      update(i.id, { description: e.target.value })
                    }
                  />
                </Field>
                <Field label={w.quantity}>
                  <input
                    type="number"
                    required
                    min="1"
                    max="1000"
                    step="1"
                    value={i.quantity || ""}
                    onChange={(e) =>
                      update(i.id, { quantity: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label={w.price}>
                  <input
                    type="number"
                    min="0"
                    step=".01"
                    value={i.price}
                    onChange={(e) => update(i.id, { price: e.target.value })}
                  />
                </Field>
              </div>
            </section>
          ))}
          <Button
            onClick={() =>
              setItems([
                ...items,
                {
                  id: crypto.randomUUID(),
                  description: "",
                  quantity: 1,
                  price: "",
                },
              ])
            }
          >
            {w.add} · {w.product}
          </Button>
          <Field label={w.notes}>
            <textarea
              value={text(notes)}
              maxLength={4000}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <FormError show={error} />
          <div className="form-actions">
            <button className="button-primary" type="submit">
              {w.save}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
