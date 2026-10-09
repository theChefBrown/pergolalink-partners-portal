import type { Order, Offer } from "./demo-types";
import type { TextKey } from "./workflow-messages";
import { demoDate } from "./demo-date";
export const scenarioDate = demoDate();
export function calendarEvents(orders: Order[], offers: Offer[]) {
  const active = orders.filter(
    (o) => !["cancelled", "completed"].includes(o.status),
  );
  const dates: [
    keyof Pick<
      Order,
      "expectedDate" | "pickupDate" | "deliveryDate" | "installationDate"
    >,
    TextKey,
  ][] = [
    ["expectedDate", "productionEvent"],
    ["pickupDate", "pickup"],
    ["deliveryDate", "deliveryEvent"],
    ["installationDate", "installationEvent"],
  ];
  return active
    .flatMap((order) => [
      ...dates
        .filter(([key]) => order[key])
        .map(([key, label]) => ({
          id: order.id + key,
          orderId: order.id,
          date: order[key],
          label,
        })),
      ...offers
        .filter(
          (o) =>
            o.orderId === order.id &&
            ["offerAvailable", "awaitingApproval"].includes(o.status),
        )
        .map((o) => ({
          id: o.id,
          orderId: order.id,
          date: o.validUntil,
          label: "deadline" as TextKey,
        })),
    ])
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function monthDays(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1)),
    offset = (first.getUTCDay() + 6) % 7;
  return Array.from(
    {
      length:
        Math.ceil(
          (offset + new Date(Date.UTC(year, month + 1, 0)).getUTCDate()) / 7,
        ) * 7,
    },
    (_, i) => new Date(Date.UTC(year, month, 1 - offset + i)),
  );
}
