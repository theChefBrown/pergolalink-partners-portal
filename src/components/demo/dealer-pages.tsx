"use client";
import { useState } from "react";
import Link from "next/link";
import type { Dealer } from "@/lib/demo-types";
import { formatDate } from "@/lib/format";
import { useDemo } from "./demo-provider";
import {
  Panel,
  Field,
  Button,
  Empty,
  Badge,
  Back,
  Modal,
  FormError,
  validForm,
} from "./ui";
import { Records } from "./records";
import { PageHeader } from "../portal/page-header";
import { MissingPage } from "../missing-page";
import { getCopy } from "@/features/configurator/locales";
export function DealerList({ admin = false }: { admin?: boolean }) {
  const { w, data, locale, commit } = useDemo(),
    [search, setSearch] = useState(""),
    [editor, setEditor] = useState<Dealer | "new" | null>(null);
  const rows = data.dealers.filter((d) =>
    [d.name, d.city, d.vat]
      .join(" ")
      .toLocaleLowerCase(locale)
      .includes(search.trim().toLocaleLowerCase(locale)),
  );
  return (
    <>
      <PageHeader
        title={w.dealers}
        action={
          admin && (
            <Button onClick={() => setEditor("new")}>
              {w.add} · {w.dealers}
            </Button>
          )
        }
      />
      <Panel>
        <Field label={w.search}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
      </Panel>
      <Panel>
        {rows.length ? (
          <Records
            headers={[
              w.name,
              w.location,
              w.country,
              w.activeOrders,
              w.totalOrders,
              w.lastActivity,
              ...(admin ? [w.status, w.action] : []),
            ]}
            rows={rows.map((d) => {
              const orders = data.orders.filter((o) => o.dealerId === d.id),
                last = orders
                  .map((o) => o.updatedAt)
                  .sort()
                  .at(-1);
              return {
                id: d.id,
                cells: [
                  <Link
                    key="link"
                    href={(admin ? "/admin" : "/manager") + "/dealers/" + d.id}
                  >
                    {d.name}
                  </Link>,
                  d.city,
                  new Intl.DisplayNames(locale, { type: "region" }).of(
                    d.country,
                  ),
                  orders.filter(
                    (o) => !["completed", "cancelled"].includes(o.status),
                  ).length,
                  orders.length,
                  last ? formatDate(last, locale) : w.noPrice,
                  ...(admin
                    ? [
                        <Badge
                          key="status"
                          value={d.active ? "active" : "inactive"}
                        />,
                        <div className="table-actions" key="actions">
                          <Button onClick={() => setEditor(d)}>{w.edit}</Button>
                          <Button
                            onClick={() =>
                              commit(
                                "recordUpdated",
                                (s) => ({
                                  ...s,
                                  dealers: s.dealers.map((x) =>
                                    x.id === d.id
                                      ? { ...x, active: !x.active }
                                      : x,
                                  ),
                                }),
                                undefined,
                                true,
                              )
                            }
                          >
                            {d.active ? w.deactivate : w.activate}
                          </Button>
                        </div>,
                      ]
                    : []),
                ],
              };
            })}
          />
        ) : (
          <Empty />
        )}
      </Panel>
      {editor && (
        <DealerEditor
          dealer={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
export function CompanyPage({
  id,
  admin = false,
}: {
  id?: string;
  admin?: boolean;
}) {
  const { w, data, dealerId, text, locale } = useDemo(),
    [editing, setEditing] = useState(false),
    [status, setStatus] = useState("");
  const dealer = data.dealers.find((d) => d.id === (id ?? dealerId));
  if (!dealer) return <MissingPage />;
  const orders = data.orders.filter((o) => o.dealerId === dealer.id),
    ids = new Set(orders.map((o) => o.id));
  const users = data.users.filter((u) => u.dealerId === dealer.id),
    activity = data.activity
      .filter((a) => a.orderId && ids.has(a.orderId) && (id || !a.internal))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  return (
    <>
      {id && <Back href={admin ? "/admin/dealers" : "/manager/dealers"} />}
      <PageHeader
        eyebrow={w.company}
        title={dealer.name}
        action={
          admin && <Button onClick={() => setEditing(true)}>{w.edit}</Button>
        }
      />
      <Panel title={w.general}>
        <dl className="detail-grid">
          {[
            [w.name, dealer.name],
            [w.vat, dealer.vat],
            [w.address, dealer.address],
            [w.location, dealer.city],
            [
              w.country,
              new Intl.DisplayNames(locale, { type: "region" }).of(
                dealer.country,
              ),
            ],
            [w.phone, dealer.phone],
            [w.email, dealer.email],
            [w.website, dealer.website],
            [
              getCopy(locale).dealerDiscount,
              `${new Intl.NumberFormat(locale).format(dealer.discountPercent ?? 0)}%`,
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v || w.noPrice}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title={w.users}>
        <Records
          headers={[w.name, w.email, w.role, w.status]}
          rows={users.map((u) => ({
            id: u.id,
            cells: [
              u.name,
              u.email,
              u.title
                ? text(u.title)
                : w[
                    u.role === "dealer"
                      ? "dealerRole"
                      : u.role === "manager"
                        ? "managerRole"
                        : "adminRole"
                  ],
              <Badge key="s" value={u.active ? "active" : "inactive"} />,
            ],
          }))}
        />
      </Panel>
      {id && (
        <>
          <Panel title={w.orders}>
            <Field label={w.status}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">{w.all}</option>
                <option value="active">{w.activeOrders}</option>
                <option value="completed">{w.completed}</option>
              </select>
            </Field>
            <Records
              headers={[w.orderNumber, w.projectName, w.status]}
              rows={orders
                .filter(
                  (o) =>
                    !status ||
                    (status === "completed"
                      ? o.status === "completed"
                      : !["completed", "cancelled"].includes(o.status)),
                )
                .map((o) => ({
                  id: o.id,
                  cells: [
                    <Link key="id" href={"/manager/orders/" + o.id}>
                      {o.id}
                    </Link>,
                    text(o.name),
                    <Badge key="s" value={o.status} />,
                  ],
                }))}
            />
          </Panel>
          <Panel title={w.activity}>
            {activity.length ? (
              activity.map((a) => (
                <Link
                  className="feed-row"
                  key={a.id}
                  href={"/manager/orders/" + a.orderId}
                >
                  <span>
                    {w[a.action]} · {a.orderId}
                  </span>
                  <small>
                    {a.user} · {formatDate(a.date, locale)}
                  </small>
                </Link>
              ))
            ) : (
              <Empty />
            )}
          </Panel>
        </>
      )}
      {editing && (
        <DealerEditor dealer={dealer} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
function DealerEditor({
  dealer,
  onClose,
}: {
  dealer?: Dealer;
  onClose: () => void;
}) {
  const { w, locale, commit } = useDemo(),
    [draft, setDraft] = useState<Dealer>(
      dealer ?? {
        id: "",
        name: "",
        vat: "",
        address: "",
        city: "",
        country: "RO",
        phone: "",
        email: "",
        website: "",
        active: true,
      },
    ),
    [error, setError] = useState(false);
  const fields = [
    "name",
    "vat",
    "address",
    "city",
    "phone",
    "email",
    "website",
  ] as const;
  return (
    <Modal
      title={(dealer ? w.edit : w.add) + " · " + w.dealers}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(e) => {
          if (
            !validForm(e) ||
            !draft.name.trim() ||
            !draft.city.trim() ||
            !Number.isFinite(draft.discountPercent ?? 0) ||
            (draft.discountPercent ?? 0) < 0 ||
            (draft.discountPercent ?? 0) > 100
          ) {
            setError(true);
            return;
          }
          const next = { ...draft, id: dealer?.id ?? crypto.randomUUID() };
          commit(
            "recordUpdated",
            (s) => ({
              ...s,
              dealers: dealer
                ? s.dealers.map((d) => (d.id === next.id ? next : d))
                : [next, ...s.dealers],
            }),
            undefined,
            true,
          );
          onClose();
        }}
      >
        <div className="form-grid">
          <Field label={getCopy(locale).dealerDiscount + " · %"}>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.01}
              value={draft.discountPercent ?? 0}
              onChange={(e) =>
                setDraft({ ...draft, discountPercent: Number(e.target.value) })
              }
            />
          </Field>
          {fields.map((f) => (
            <Field label={w[f === "city" ? "location" : f]} key={f}>
              <input
                required={["name", "vat", "city", "email"].includes(f)}
                type={
                  f === "email"
                    ? "email"
                    : f === "website"
                      ? "url"
                      : f === "phone"
                        ? "tel"
                        : "text"
                }
                value={draft[f]}
                maxLength={200}
                onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
              />
            </Field>
          ))}
          <Field label={w.country}>
            <select
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            >
              {["RO", "GB", "IT", "ES", "DE", "HU", "FR"].map((c) => (
                <option key={c} value={c}>
                  {new Intl.DisplayNames(locale, { type: "region" }).of(c)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="check-field">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
          />
          {w.active}
        </label>
        <FormError show={error} />
        <div className="form-actions">
          <Button onClick={onClose}>{w.cancel}</Button>
          <button className="button-primary" type="submit">
            {w.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
