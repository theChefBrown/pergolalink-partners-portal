"use client";
import { useState } from "react";
import type {
  Order,
  OrderStatus,
  Update,
  DemoDocument,
} from "@/lib/demo-types";
import { orderStatuses } from "@/lib/demo-types";
import type { TextKey } from "@/lib/workflow-messages";
import { useDemo } from "./demo-provider";
import { Modal, Field, Button, FormError, validForm } from "./ui";
import { FilePicker } from "./documents";
import {
  attachmentBytes,
  MAX_ATTACHMENT_BYTES,
} from "@/features/configurator/catalog";
export type OrderAction =
  | "requestOffer"
  | "requestChange"
  | "sendInfo"
  | "sendMessage"
  | "upload"
  | "statusChanged"
  | "delayed"
  | "actionRequired"
  | "internalNote";
export function OrderActionDialog({
  order,
  action,
  onClose,
}: {
  order: Order;
  action: OrderAction;
  onClose: () => void;
}) {
  const { w, role, commit, registerFile, data } = useDemo();
  const orderBytes = data.documents
    .filter((d) => d.orderId === order.id && !d.generated)
    .reduce((n, d) => n + (d.size ?? 0), 0);
  const [body, setBody] = useState(""),
    [status, setStatus] = useState<OrderStatus>(order.status),
    [internal, setInternal] = useState(""),
    [internalStatus, setInternalStatus] = useState(order.internalStatus),
    [expected, setExpected] = useState(order.expectedDate),
    [pickup, setPickup] = useState(order.pickupDate),
    [delivery, setDelivery] = useState(order.deliveryDate),
    [reason, setReason] = useState<TextKey>("materials"),
    [files, setFiles] = useState<File[]>([]),
    [visible, setVisible] = useState(true),
    [error, setError] = useState(false);
  const staff = role !== "dealer";
  const isStatus = action === "statusChanged",
    isDelay = action === "delayed",
    isUpload = action === "upload",
    isInternal = action === "internalNote";
  return (
    <Modal title={w[action]} onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          if (
            !validForm(e) ||
            (isUpload &&
              (!files.length ||
                orderBytes + attachmentBytes(files) > MAX_ATTACHMENT_BYTES)) ||
            (!isUpload &&
              !isStatus &&
              action !== "requestOffer" &&
              !body.trim()) ||
            (isStatus && pickup && delivery && pickup > delivery)
          ) {
            setError(true);
            return;
          }
          const now = new Date().toISOString();
          const message: Update = {
            id: crypto.randomUUID(),
            orderId: order.id,
            author: role,
            body: body.trim() || { key: action },
            internal: isInternal,
            type:
              action === "requestOffer" ||
              action === "requestChange" ||
              action === "sendInfo"
                ? action
                : isInternal
                  ? "internalNote"
                  : "message",
            resolved: staff,
            date: now,
          };
          const docs: DemoDocument[] = files.map((file) => ({
            id: crypto.randomUUID(),
            orderId: order.id,
            productId: order.items[0]?.productId ?? "",
            title: file.name,
            description: "",
            category: "other",
            fileName: file.name,
            url: registerFile(file),
            mime: file.type,
            size: file.size,
            visible: staff ? visible : true,
            archived: false,
            date: now,
          }));
          commit(
            isUpload
              ? "documentAdded"
              : isStatus || isDelay
                ? "statusChanged"
                : "messageSent",
            (s) => ({
              ...s,
              orders: s.orders.map((o) =>
                o.id !== order.id
                  ? o
                  : {
                      ...o,
                      updatedAt: now,
                      ...(isStatus
                        ? {
                            status,
                            internalStatus,
                            expectedDate: expected,
                            pickupDate: pickup,
                            deliveryDate: delivery,
                            ...(status !== "delayed"
                              ? { delay: undefined }
                              : {}),
                          }
                        : {}),
                      ...(isDelay
                        ? {
                            status: "delayed" as const,
                            expectedDate: expected,
                            delay: {
                              reason,
                              explanation: body,
                              internal,
                              date: expected,
                            },
                          }
                        : {}),
                      ...(action === "actionRequired"
                        ? { actionRequired: body }
                        : {}),
                      ...(action === "sendInfo"
                        ? {
                            actionRequired: undefined,
                            ...(o.status === "informationRequired"
                              ? { status: "review" as const }
                              : {}),
                          }
                        : {}),
                    },
              ),
              documents: [...docs, ...s.documents],
              updates: isUpload
                ? s.updates
                : [
                    message,
                    ...(internal
                      ? [
                          {
                            ...message,
                            id: crypto.randomUUID(),
                            body: internal,
                            internal: true,
                            type: "internalNote" as const,
                          },
                        ]
                      : []),
                    ...s.updates,
                  ],
              notifications:
                staff && !isInternal && (!isUpload || visible)
                  ? [
                      {
                        id: crypto.randomUUID(),
                        orderId: order.id,
                        text: isStatus
                          ? { key: status }
                          : isUpload
                            ? { key: "documentAdded" }
                            : body || { key: action },
                        read: false,
                        date: now,
                      },
                      ...s.notifications,
                    ]
                  : s.notifications,
            }),
            order.id,
            isInternal || (isUpload && !visible),
          );
          onClose();
        }}
      >
        <div className="form-grid">
          {isStatus && (
            <>
              <Field label={w.status}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                >
                  {orderStatuses
                    .filter(
                      (s) => s !== "delayed" || order.status === "delayed",
                    )
                    .map((s) => (
                      <option key={s} value={s}>
                        {w[s]}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label={w.internalStatus}>
                <input
                  value={internalStatus}
                  onChange={(e) => setInternalStatus(e.target.value)}
                  maxLength={200}
                />
              </Field>
            </>
          )}
          {isDelay && (
            <Field label={w.delayReason}>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as TextKey)}
              >
                {(
                  [
                    "materials",
                    "workload",
                    "supplier",
                    "clarification",
                    "transport",
                    "other",
                  ] as const
                ).map((key) => (
                  <option key={key} value={key}>
                    {w[key]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {(isStatus || isDelay) && (
            <Field label={w.expectedDate}>
              <input
                type="date"
                required={isDelay}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
              />
            </Field>
          )}
          {isStatus && (
            <>
              <Field label={w.pickupDate}>
                <input
                  type="date"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </Field>
              <Field label={w.deliveryDate}>
                <input
                  type="date"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                />
              </Field>
            </>
          )}
        </div>
        {!isUpload && (
          <Field
            label={
              isInternal
                ? w.internalNote
                : isDelay
                  ? w.publicExplanation
                  : staff
                    ? w.publicUpdate
                    : w.message
            }
          >
            <textarea
              required={!isStatus && action !== "requestOffer"}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
        )}
        {isDelay && (
          <Field label={w.internalNote}>
            <textarea
              value={internal}
              maxLength={4000}
              onChange={(e) => setInternal(e.target.value)}
            />
          </Field>
        )}
        {isUpload && (
          <>
            <FilePicker onFiles={setFiles} orderBytes={orderBytes} />
            <ul className="file-list">
              {files.map((f, i) => (
                <li key={i}>
                  {f.name}
                  <Button
                    onClick={() => setFiles(files.filter((_, n) => n !== i))}
                  >
                    {w.remove}
                  </Button>
                </li>
              ))}
            </ul>
            {staff && (
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                />
                {w.visibility}
              </label>
            )}
          </>
        )}
        <FormError show={error} />
        <div className="form-actions">
          <Button onClick={onClose}>{w.cancel}</Button>
          <button className="button-primary" type="submit">
            {isStatus || isDelay ? w.save : w.send}
          </button>
        </div>
      </form>
    </Modal>
  );
}
