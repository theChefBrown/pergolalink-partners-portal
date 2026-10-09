"use client";
/* eslint-disable @next/next/no-img-element -- Temporary browser object URLs are local previews. */
import { useState } from "react";
import type { DemoDocument } from "@/lib/demo-types";
import { useDemo } from "./demo-provider";
import { Button, Modal } from "./ui";
import { getCopy } from "@/features/configurator/locales";
import {
  MAX_ATTACHMENT_BYTES,
  attachmentBytes,
} from "@/features/configurator/catalog";
export function FilePicker({
  onFiles,
  multiple = true,
  orderBytes,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  orderBytes?: number;
}) {
  const { w, locale } = useDemo();
  const [invalid, setInvalid] = useState(false);
  return (
    <>
      <label className="file-input-label">
        <span>{w.upload}</span>
        <small>
          {orderBytes === undefined ? w.fileHint : getCopy(locale).fileHint}
        </small>
        <input
          className="sr-only"
          type="file"
          multiple={multiple}
          accept={
            orderBytes === undefined
              ? ".pdf,.jpg,.jpeg,.png,.webp,.txt"
              : ".pdf,.jpg,.jpeg,.png,.webp"
          }
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []),
              allowed = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp",
                "text/plain",
              ];
            const bad =
              (orderBytes !== undefined &&
                (orderBytes + attachmentBytes(files) > MAX_ATTACHMENT_BYTES ||
                  files.some((f) => f.type === "text/plain"))) ||
              files.some(
                (f) =>
                  f.size >
                    (orderBytes === undefined
                      ? 15 * 1024 * 1024
                      : MAX_ATTACHMENT_BYTES) ||
                  f.size === 0 ||
                  !allowed.includes(f.type),
              );
            setInvalid(bad);
            if (!bad) onFiles(files);
            e.target.value = "";
          }}
        />
      </label>
      {invalid && (
        <p className="form-error" role="alert">
          {orderBytes === undefined ? w.fileInvalid : getCopy(locale).fileError}
        </p>
      )}
    </>
  );
}
export function DocumentCard({ document }: { document: DemoDocument }) {
  const { w, text } = useDemo();
  const [open, setOpen] = useState(false);
  return (
    <article className="file-card">
      <h3>{text(document.title)}</h3>
      <p>{document.fileName}</p>
      <div className="table-actions">
        <Button onClick={() => setOpen(true)}>{w.view}</Button>
        <a
          className="button-secondary"
          href={document.url}
          download={document.fileName}
        >
          {w.download}
        </a>
      </div>
      {open && (
        <Modal title={text(document.title)} onClose={() => setOpen(false)}>
          <p>{text(document.description)}</p>
          {document.mime.startsWith("image/") ? (
            <img
              className="preview-image"
              src={document.url}
              alt={text(document.title)}
            />
          ) : (
            <iframe
              className="preview-frame"
              title={text(document.title)}
              src={document.url}
              // Chrome's native PDF viewer cannot run inside a sandboxed frame.
              sandbox={document.mime === "application/pdf" ? undefined : ""}
            />
          )}
          <div className="form-actions">
            <a
              className="button-primary"
              href={document.url}
              download={document.fileName}
            >
              {w.download}
            </a>
          </div>
        </Modal>
      )}
    </article>
  );
}
