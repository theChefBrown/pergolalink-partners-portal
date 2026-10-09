"use client";
/* eslint-disable @next/next/no-img-element -- Reusable component: browser object URLs do not use a Next image server. */
import { useEffect, useRef, useState } from "react";
import { attachmentBytes, MAX_ATTACHMENT_BYTES } from "./catalog";
import type { Copy } from "./locales";
import { CIcon } from "./ui";
export async function validAttachment(file: File) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return (
    file.size > 0 &&
    ((file.type === "image/jpeg" &&
      /\.jpe?g$/i.test(file.name) &&
      b[0] === 255 &&
      b[1] === 216 &&
      b[2] === 255) ||
      (file.type === "image/png" &&
        /\.png$/i.test(file.name) &&
        [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) ||
      (file.type === "image/webp" &&
        /\.webp$/i.test(file.name) &&
        String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...b.slice(8, 12)) === "WEBP") ||
      (file.type === "application/pdf" &&
        /\.pdf$/i.test(file.name) &&
        String.fromCharCode(...b.slice(0, 5)) === "%PDF-"))
  );
}
export function Attachments({
  files,
  onChange,
  t,
  onBusyChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  t: Copy;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [error, setError] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <section className="ac-attachments">
      <div className="ac-section-heading">
        <h3>
          <CIcon name="image" />
          {t.photos}
        </h3>
        <span>{(attachmentBytes(files) / 1024 / 1024).toFixed(1)} / 20 MB</span>
      </div>
      <label className="ac-upload">
        <CIcon name="upload" />
        <span>
          <strong>{busy ? t.loading : t.upload}</strong>
          <small>{t.fileHint}</small>
        </span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={busy}
          aria-label={t.upload}
          onChange={async (e) => {
            const incoming = Array.from(e.target.files ?? []);
            e.target.value = "";
            setBusy(true);
            onBusyChange?.(true);
            setError(false);
            try {
              if (
                attachmentBytes([...files, ...incoming]) >
                  MAX_ATTACHMENT_BYTES ||
                !(await Promise.all(incoming.map(validAttachment))).every(
                  Boolean,
                )
              ) {
                setError(true);
                return;
              }
              onChange([...files, ...incoming]);
            } catch {
              setError(true);
            } finally {
              setBusy(false);
              onBusyChange?.(false);
            }
          }}
        />
      </label>
      {error && (
        <p className="ac-error" role="alert">
          {t.fileError}
        </p>
      )}
      {files.length > 0 && (
        <ul className="ac-file-list">
          {files.map((f, i) => (
            <li key={i}>
              {f.type.startsWith("image/") ? (
                <FileThumbnail file={f} />
              ) : (
                <CIcon name="document" />
              )}
              <span>
                <strong>{f.name}</strong>
                <small>{(f.size / 1024 / 1024).toFixed(2)} MB</small>
              </span>
              <button
                type="button"
                className="ac-icon-button"
                disabled={busy}
                aria-label={`${t.remove}: ${f.name}`}
                onClick={() => onChange(files.filter((_, j) => i !== j))}
              >
                <CIcon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
function FileThumbnail({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} alt={file.name} />;
}

