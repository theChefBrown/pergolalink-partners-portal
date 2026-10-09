import type {
  DemoState,
  DemoRole,
  OfferStatus,
  Update,
  Notification,
} from "./demo-types";
import type { DemoText } from "./workflow-messages";
/** Pure local transition: keep the offer, related order and communication in sync. */
export function changeOffer(
  state: DemoState,
  id: string,
  status: OfferStatus,
  context: { role: DemoRole; message: string; date: string; eventId: string },
): DemoState {
  const offer = state.offers.find((o) => o.id === id);
  if (!offer) return state;
  const text: DemoText = context.message.trim() || {
    key:
      status === "accepted"
        ? "offerAccepted"
        : status === "offerAvailable"
          ? "offerNotification"
          : "requestChange",
  };
  const update: Update = {
    id: context.eventId,
    orderId: offer.orderId,
    author: context.role,
    body: text,
    internal: false,
    type: status === "modificationRequested" ? "requestChange" : "message",
    resolved: status !== "modificationRequested",
    date: context.date,
  };
  const notification: Notification = {
    id: context.eventId + "-notification",
    orderId: offer.orderId,
    text,
    read: false,
    date: context.date,
  };
  const early = [
    "submitted",
    "review",
    "informationRequired",
    "offerAvailable",
    "awaitingApproval",
    "confirmed",
  ];
  return {
    ...state,
    offers: state.offers.map((o) =>
      o.id === id
        ? { ...o, status }
        : status === "offerAvailable" &&
            o.orderId === offer.orderId &&
            [
              "offerAvailable",
              "awaitingApproval",
              "modificationRequested",
            ].includes(o.status)
          ? { ...o, status: "expired" }
          : o,
    ),
    orders: state.orders.map((o) =>
      o.id === offer.orderId
        ? {
            ...o,
            updatedAt: context.date,
            ...(early.includes(o.status)
              ? {
                  status:
                    status === "accepted"
                      ? "confirmed"
                      : status === "offerAvailable"
                        ? "offerAvailable"
                        : status === "modificationRequested"
                          ? "review"
                          : o.status,
                }
              : {}),
          }
        : o,
    ),
    updates: [
      update,
      ...state.updates.map((u) =>
        u.orderId === offer.orderId &&
        status === "offerAvailable" &&
        ["requestOffer", "requestChange"].includes(u.type)
          ? { ...u, resolved: true }
          : u,
      ),
    ],
    notifications:
      context.role !== "dealer"
        ? [notification, ...state.notifications]
        : state.notifications,
  };
}
