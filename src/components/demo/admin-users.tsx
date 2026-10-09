"use client";
import { useState } from "react";
import type { DemoUser, DemoRole } from "@/lib/demo-types";
import { useDemo } from "./demo-provider";
import {
  Panel,
  Field,
  Button,
  Empty,
  Badge,
  Modal,
  FormError,
  validForm,
} from "./ui";
import { Records } from "./records";
import { PageHeader } from "../portal/page-header";
const roles: DemoRole[] = ["dealer", "manager", "admin"];
export function AdminUsers() {
  const { data, w, locale, commit } = useDemo(),
    [search, setSearch] = useState(""),
    [role, setRole] = useState(""),
    [editor, setEditor] = useState<DemoUser | "new" | null>(null);
  const users = data.users.filter(
    (u) =>
      (!role || u.role === role) &&
      [u.name, u.email]
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(search.trim().toLocaleLowerCase(locale)),
  );
  return (
    <>
      <PageHeader
        title={w.users}
        action={
          <Button onClick={() => setEditor("new")}>
            {w.add} · {w.user}
          </Button>
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
          <Field label={w.role}>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">{w.all}</option>
              {roles.map((r) => (
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
        {users.length ? (
          <Records
            headers={[w.name, w.email, w.role, w.dealers, w.status, w.action]}
            rows={users.map((u) => ({
              id: u.id,
              cells: [
                u.name,
                u.email,
                w[
                  u.role === "dealer"
                    ? "dealerRole"
                    : u.role === "manager"
                      ? "managerRole"
                      : "adminRole"
                ],
                data.dealers.find((d) => d.id === u.dealerId)?.name ??
                  "PergolaLink",
                <Badge key="s" value={u.active ? "active" : "inactive"} />,
                <div className="table-actions" key="actions">
                  <Button onClick={() => setEditor(u)}>{w.edit}</Button>
                  <Button
                    onClick={() =>
                      commit(
                        "recordUpdated",
                        (s) => ({
                          ...s,
                          users: s.users.map((x) =>
                            x.id === u.id ? { ...x, active: !x.active } : x,
                          ),
                        }),
                        undefined,
                        true,
                      )
                    }
                  >
                    {u.active ? w.deactivate : w.activate}
                  </Button>
                </div>,
              ],
            }))}
          />
        ) : (
          <Empty />
        )}
      </Panel>
      {editor && (
        <UserEditor
          user={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
function UserEditor({
  user,
  onClose,
}: {
  user?: DemoUser;
  onClose: () => void;
}) {
  const { w, data, commit } = useDemo(),
    [draft, setDraft] = useState<DemoUser>(
      user ?? {
        id: "",
        name: "",
        email: "",
        role: "dealer",
        dealerId: data.dealers.find((d) => d.active)?.id ?? "",
        active: true,
      },
    ),
    [error, setError] = useState(false);
  return (
    <Modal title={(user ? w.edit : w.add) + " · " + w.user} onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          if (!validForm(e) || !draft.name.trim()) {
            setError(true);
            return;
          }
          const next = {
            ...draft,
            id: user?.id ?? crypto.randomUUID(),
            dealerId: draft.role === "dealer" ? draft.dealerId : "",
            title: undefined,
          };
          commit(
            "recordUpdated",
            (s) => ({
              ...s,
              users: user
                ? s.users.map((u) => (u.id === next.id ? next : u))
                : [next, ...s.users],
            }),
            undefined,
            true,
          );
          onClose();
        }}
      >
        <div className="form-grid">
          <Field label={w.name}>
            <input
              required
              maxLength={100}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field label={w.email}>
            <input
              required
              type="email"
              maxLength={200}
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </Field>
          <Field label={w.role}>
            <select
              value={draft.role}
              onChange={(e) =>
                setDraft({ ...draft, role: e.target.value as DemoRole })
              }
            >
              {roles.map((r) => (
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
          {draft.role === "dealer" && (
            <Field label={w.dealers}>
              <select
                required
                value={draft.dealerId}
                onChange={(e) =>
                  setDraft({ ...draft, dealerId: e.target.value })
                }
              >
                <option value="">—</option>
                {data.dealers
                  .filter((d) => d.active || d.id === draft.dealerId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
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
