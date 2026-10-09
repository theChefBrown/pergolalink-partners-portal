import type { Order, OrderItem, OrderStatus } from "../demo-types";
import { dealers } from "./dealers";
import {
  createSystem,
  models,
  isRoof,
  isMotorized,
} from "../../features/configurator/catalog";
import { priceOrder } from "../../features/configurator/pricing";
import type { ModelId } from "../../features/configurator/types";
import { demoDate } from "../demo-date";
export function demoItem(model: ModelId, index = 0): OrderItem {
  const s = createSystem(model, `demo-system-${index}`);
  return {
    id: s.id,
    productId: model === "aeris" ? "bioclimatic" : model,
    model: models.find((m) => m.id === model)!.name,
    quantity: s.quantity,
    width: s.width,
    height: s.height,
    projection: isRoof(model) ? s.projection : 0,
    colour: s.frameColour,
    motor: isMotorized(model) ? s.motor : "",
    lighting: s.lighting,
    options: "",
    notes: "",
    configuration: s,
  };
}
const statuses: OrderStatus[] = [
  "submitted",
  "offerAvailable",
  "production",
  "informationRequired",
  "pickupReady",
  "confirmed",
  "review",
  "inDelivery",
  "delayed",
  "submitted",
  "completed",
  "offerAvailable",
  "preparing",
  "onHold",
  "review",
];
export const orders: Order[] = Array.from({ length: 15 }, (_, i) => {
  const dealer = dealers[Math.floor(i / 3)],
    item = demoItem(models[i % models.length].id, i + 1);
  return {
    id: `DEMO-${String(i + 1).padStart(4, "0")}`,
    dealerId: dealer.id,
    name: `Demo project ${String(i + 1).padStart(2, "0")} · ${dealer.city}`,
    clientRef: `DEMO-CLIENT-${i + 1}`,
    city: dealer.city,
    country: dealer.country,
    address: `Example Avenue ${i + 10}`,
    county: "",
    localityId: "",
    notes: "",
    items: [item],
    status: statuses[i],
    createdAt: demoDate(-10 + (i % 5)),
    updatedAt: demoDate(-1),
    expectedDate: demoDate((i % 7) + 2),
    pickupDate: demoDate((i % 7) + 4),
    deliveryDate: demoDate((i % 7) + 5),
    installationDate: demoDate((i % 7) + 6),
    internalStatus: "",
    ...(statuses[i] === "informationRequired"
      ? { actionRequired: { key: "confirmColour" as const } }
      : {}),
    ...(statuses[i] === "delayed"
      ? {
          delay: {
            reason: "materials" as const,
            explanation: { key: "waitingExplanation" as const },
            internal: "Demo scheduling note",
            date: demoDate(7),
          },
        }
      : {}),
    pricing: priceOrder([item.configuration!], dealer.discountPercent, {
      id: dealer.id,
      name: dealer.name,
    }),
  };
});
