import type { DemoState, Offer, DemoDocument } from "../demo-types";
import { orders } from "./orders";
import { products } from "./products";
import { dealers, users } from "./dealers";
import { demoDate } from "../demo-date";
import { pricePolicy } from "../../features/configurator/price-policy";
const offers: Offer[] = [1, 4, 7, 10, 11, 14].map((index, n) => ({
  id: `QUOTE-${String(n + 1).padStart(4, "0")}`,
  orderId: orders[index].id,
  date: demoDate(-1),
  validUntil: demoDate(30),
  revision: 1,
  status: n === 1 ? "draft" : n === 2 ? "accepted" : "offerAvailable",
  items: orders[index].items.map((i) => ({
    id: i.id,
    description: i.model,
    quantity: i.quantity,
    price: ((orders[index].pricing!.netCents ?? 10000) / 100).toFixed(2),
  })),
  notes: "Fictional demo quotation.",
}));
const documents: DemoDocument[] = products
  .filter((p) => p.id !== "other")
  .map((p, index) => ({
    id: `demo-document-${index}`,
    productId: p.id,
    title: { key: "measurementGuide" },
    description: { key: "sampleDocument" },
    category: p.category,
    fileName: "demo-guide.pdf",
    url: "/demo/sample.pdf",
    mime: "application/pdf",
    visible: true,
    archived: false,
    date: demoDate(-3),
  }));
export const initialDemoState: DemoState = {
  orders,
  products,
  dealers,
  users,
  offers,
  documents,
  pricingPolicy: pricePolicy,
  updates: orders
    .slice(0, 7)
    .map((o, i) => ({
      id: `demo-message-${i}`,
      orderId: o.id,
      author: i % 2 ? "dealer" : "manager",
      body: { key: i % 2 ? "requestOffer" : "productionNotification" },
      internal: false,
      type: i % 2 ? "requestOffer" : "message",
      resolved: i % 2 === 0,
      date: demoDate(-1) + "T10:00:00Z",
    })),
  notifications: offers
    .filter((o) => o.status === "offerAvailable")
    .map((o, i) => ({
      id: `demo-notification-${i}`,
      orderId: o.orderId,
      text: { key: "offerNotification" },
      read: false,
      date: demoDate(-1) + "T11:00:00Z",
    })),
  activity: orders.map((o, i) => ({
    id: `demo-activity-${i}`,
    orderId: o.id,
    user: `Demo Partner ${Math.floor(i / 3) + 1}`,
    role: "dealer",
    action: "orderCreated",
    date: o.createdAt + "T09:00:00Z",
    internal: false,
  })),
};
