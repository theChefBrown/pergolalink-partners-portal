"use client";
/* eslint-disable @next/next/no-img-element -- Images are temporary local browser object URLs. */
import { useState } from "react";
import { categories, type Product } from "@/lib/demo-types";
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
import { FilePicker } from "./documents";
import { Records } from "./records";
import { PageHeader } from "../portal/page-header";
import { Icon } from "../icon";
import { PostTariffs } from "./post-tariffs";
export function AdminProducts() {
  const { data, w, text, locale, commit } = useDemo(),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [editor, setEditor] = useState<Product | "new" | null>(null);
  const rows = data.products.filter(
    (p) =>
      (!category || p.category === category) &&
      [text(p.name), p.model, text(p.description)]
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(search.trim().toLocaleLowerCase(locale)),
  );
  return (
    <>
      <PageHeader
        title={w.products}
        action={
          <Button onClick={() => setEditor("new")}>
            {w.add} · {w.product}
          </Button>
        }
      />
      <PostTariffs />
      <Panel>
        <div className="form-grid">
          <Field label={w.search}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label={w.category}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{w.all}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {w[c]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>
      <Panel>
        {rows.length ? (
          <Records
            headers={[
              w.image,
              w.name,
              w.category,
              w.modelLabel,
              w.status,
              w.action,
            ]}
            rows={rows.map((p) => ({
              id: p.id,
              cells: [
                p.image ? (
                  <img
                    key="image"
                    className="product-thumb"
                    src={p.image}
                    alt={text(p.name)}
                  />
                ) : (
                  <Icon key="icon" name="layers" />
                ),
                text(p.name),
                w[p.category],
                p.model,
                <Badge key="status" value={p.active ? "active" : "inactive"} />,
                <div className="table-actions" key="actions">
                  <Button onClick={() => setEditor(p)}>{w.edit}</Button>
                  <Button
                    onClick={() =>
                      commit(
                        "recordUpdated",
                        (s) => ({
                          ...s,
                          products: s.products.map((x) =>
                            x.id === p.id ? { ...x, active: !x.active } : x,
                          ),
                        }),
                        undefined,
                        true,
                      )
                    }
                  >
                    {p.active ? w.deactivate : w.activate}
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
        <ProductEditor
          product={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
function ProductEditor({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const { w, text, commit, registerFile } = useDemo(),
    [draft, setDraft] = useState<Product>(
      product ?? {
        id: "",
        name: "",
        category: "retractable",
        model: "",
        description: "",
        options: "",
        active: true,
      },
    ),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(false),
    [badImage, setBadImage] = useState(false);
  const update = (values: Partial<Product>) =>
    setDraft({ ...draft, ...values });
  return (
    <Modal
      title={(product ? w.edit : w.add) + " · " + w.product}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(e) => {
          if (!validForm(e) || !text(draft.name).trim() || badImage) {
            setError(true);
            return;
          }
          const next = {
            ...draft,
            id: product?.id ?? crypto.randomUUID(),
            image: file ? registerFile(file) : draft.image,
          };
          commit(
            "recordUpdated",
            (s) => ({
              ...s,
              products: product
                ? s.products.map((p) => (p.id === next.id ? next : p))
                : [next, ...s.products],
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
              maxLength={120}
              value={text(draft.name)}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          <Field label={w.category}>
            <select
              value={draft.category}
              onChange={(e) =>
                update({ category: e.target.value as Product["category"] })
              }
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {w[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={w.modelLabel}>
            <input
              maxLength={100}
              value={draft.model}
              onChange={(e) => update({ model: e.target.value })}
            />
          </Field>
        </div>
        <Field label={w.description}>
          <textarea
            value={text(draft.description)}
            maxLength={4000}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
        <Field label={w.options}>
          <textarea
            value={draft.options}
            maxLength={4000}
            onChange={(e) => update({ options: e.target.value })}
          />
        </Field>
        <label className="check-field">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => update({ active: e.target.checked })}
          />
          {w.active}
        </label>
        <p>{w.image}</p>
        <FilePicker
          multiple={false}
          onFiles={(files) => {
            const next = files[0] ?? null;
            setBadImage(Boolean(next && !next.type.startsWith("image/")));
            setFile(next?.type.startsWith("image/") ? next : null);
          }}
        />
        {badImage && (
          <p className="form-error" role="alert">
            {w.fileInvalid}
          </p>
        )}
        {file && <p>{file.name}</p>}
        {(file || draft.image) && (
          <Button
            onClick={() => {
              setFile(null);
              setBadImage(false);
              update({ image: undefined });
            }}
          >
            {w.remove} · {w.image}
          </Button>
        )}
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
