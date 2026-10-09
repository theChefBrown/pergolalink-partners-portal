"use client";
import {
  useEffect,
  useId,
  useRef,
  cloneElement,
  type ReactNode,
  type ReactElement,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useDemo } from "./demo-provider";
import { Icon } from "../icon";
import type { TextKey } from "@/lib/workflow-messages";
export function Panel({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="portal-panel demo-panel">
      {title && (
        <div className="panel-heading">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
export function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      className="button-secondary"
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint ? id + "-hint" : undefined,
      })}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
export function Empty() {
  const { w } = useDemo();
  return (
    <div className="empty-state">
      <Icon name="layers" />
      <h3>{w.emptyTitle}</h3>
      <p>{w.emptyBody}</p>
    </div>
  );
}
export function Badge({ value }: { value: TextKey }) {
  const { w } = useDemo();
  return (
    <span className={"status-badge status-" + value}>
      <span />
      {w[value]}
    </span>
  );
}
export function Back({ href }: { href: string }) {
  const { w } = useDemo();
  return (
    <Link className="back-link" href={href}>
      ← {w.back}
    </Link>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  const { w } = useDemo();
  useEffect(() => {
    const d = ref.current;
    const prior = document.activeElement;
    d?.showModal();
    return () => {
      d?.close();
      if (prior instanceof HTMLElement && prior.isConnected) prior.focus();
    };
  }, []);
  return (
    <dialog
      className="demo-dialog"
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-heading">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label={w.closeDialog}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function validForm(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return e.currentTarget.checkValidity();
}
export function FormError({ show }: { show: boolean }) {
  const { w } = useDemo();
  return show ? (
    <p className="form-error" role="alert">
      {w.required}
    </p>
  ) : null;
}
export function Confirmation({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { w } = useDemo();
  return (
    <Modal title={title} onClose={onClose}>
      <p>{w.deleteConfirm}</p>
      <div className="form-actions">
        <Button onClick={onClose}>{w.cancel}</Button>
        <button className="button-primary" onClick={onConfirm}>
          {w.confirm}
        </button>
      </div>
    </Modal>
  );
}
