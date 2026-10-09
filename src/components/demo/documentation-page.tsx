"use client";
import { useState } from "react";
import { categories, type DemoDocument } from "@/lib/demo-types";
import { useDemo } from "./demo-provider";
import {
  Panel,
  Field,
  Button,
  Empty,
  Modal,
  FormError,
  validForm,
  Confirmation,
  Badge,
} from "./ui";
import { DocumentCard, FilePicker } from "./documents";
import { PageHeader } from "../portal/page-header";
export function DocumentationPage({
  staff = false,
  admin = false,
}: {
  staff?: boolean;
  admin?: boolean;
}) {
  const { data, w, text, locale, commit } = useDemo();
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [product, setProduct] = useState(""),
    [archived, setArchived] = useState(false),
    [editor, setEditor] = useState<DemoDocument | "new" | null>(null),
    [archive, setArchive] = useState<string | null>(null);
  const docs = data.documents.filter(
    (d) =>
      !d.orderId &&
      (staff || d.visible) &&
      d.archived === (admin && archived) &&
      (!category || d.category === category) &&
      (!product || d.productId === product) &&
      [
        text(d.title),
        text(d.description),
        d.fileName,
        text(data.products.find((p) => p.id === d.productId)?.name ?? ""),
      ]
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(search.trim().toLocaleLowerCase(locale)),
  );
  return (
    <>
      <PageHeader
        title={w.documentation}
        action={
          admin && (
            <Button onClick={() => setEditor("new")}>
              {w.add} · {w.documentation}
            </Button>
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
          <Field label={w.product}>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              <option value="">{w.all}</option>
              {data.products.map((p) => (
                <option value={p.id} key={p.id}>
                  {text(p.name)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {admin && (
          <label className="check-field">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            {w.archive}
          </label>
        )}
      </Panel>
      <Panel>
        {docs.length ? (
          <div className="file-grid">
            {docs.map((d) => (
              <div key={d.id}>
                <DocumentCard document={d} />
                {staff && !d.visible && <Badge value="internalNote" />}
                {admin && (
                  <div className="table-actions document-controls">
                    <Button onClick={() => setEditor(d)}>{w.edit}</Button>
                    <Button
                      onClick={() =>
                        d.archived
                          ? commit(
                              "recordUpdated",
                              (s) => ({
                                ...s,
                                documents: s.documents.map((x) =>
                                  x.id === d.id ? { ...x, archived: false } : x,
                                ),
                              }),
                              undefined,
                              true,
                            )
                          : setArchive(d.id)
                      }
                    >
                      {d.archived ? w.activate : w.archive}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Panel>
      {editor && (
        <DocumentEditor
          document={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
      {archive && (
        <Confirmation
          title={w.archive}
          onClose={() => setArchive(null)}
          onConfirm={() => {
            commit(
              "recordUpdated",
              (s) => ({
                ...s,
                documents: s.documents.map((d) =>
                  d.id === archive ? { ...d, archived: true } : d,
                ),
              }),
              undefined,
              true,
            );
            setArchive(null);
          }}
        />
      )}
    </>
  );
}
function DocumentEditor({
  document,
  onClose,
}: {
  document?: DemoDocument;
  onClose: () => void;
}) {
  const { w, data, text, commit, registerFile } = useDemo();
  const [draft, setDraft] = useState<DemoDocument>(
      document ?? {
        id: "",
        productId: data.products[0]?.id ?? "",
        title: "",
        description: "",
        category: "retractable",
        fileName: "",
        url: "",
        mime: "",
        visible: true,
        archived: false,
        date: "",
      },
    ),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(false);
  const update = (values: Partial<DemoDocument>) =>
    setDraft({ ...draft, ...values });
  return (
    <Modal
      title={w.documentation + " · " + (document ? w.edit : w.add)}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(e) => {
          if (
            !validForm(e) ||
            !text(draft.title).trim() ||
            (!file && !draft.url)
          ) {
            setError(true);
            return;
          }
          const next = {
            ...draft,
            id: document?.id ?? crypto.randomUUID(),
            date: new Date().toISOString(),
            ...(file
              ? {
                  url: registerFile(file),
                  fileName: file.name,
                  mime: file.type,
                }
              : {}),
          };
          commit(
            "documentAdded",
            (s) => ({
              ...s,
              documents: document
                ? s.documents.map((d) => (d.id === next.id ? next : d))
                : [next, ...s.documents],
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
              maxLength={160}
              value={text(draft.title)}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label={w.category}>
            <select
              value={draft.category}
              onChange={(e) =>
                update({ category: e.target.value as DemoDocument["category"] })
              }
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {w[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={w.product}>
            <select
              value={draft.productId}
              onChange={(e) => update({ productId: e.target.value })}
            >
              <option value="">{w.all}</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {text(p.name)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={w.description}>
          <textarea
            maxLength={4000}
            value={text(draft.description)}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
        <label className="check-field">
          <input
            type="checkbox"
            checked={draft.visible}
            onChange={(e) => update({ visible: e.target.checked })}
          />
          {w.visibility}
        </label>
        <FilePicker
          multiple={false}
          onFiles={(files) => setFile(files[0] ?? null)}
        />
        <p>{file?.name ?? draft.fileName}</p>
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
