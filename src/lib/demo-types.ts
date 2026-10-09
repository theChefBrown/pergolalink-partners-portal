import type { DemoText, TextKey } from "./workflow-messages";
import type { SystemConfiguration } from "../features/configurator/types";
export type DemoRole = "dealer" | "manager" | "admin";
export const orderStatuses = [
  "submitted",
  "review",
  "informationRequired",
  "offerAvailable",
  "awaitingApproval",
  "confirmed",
  "production",
  "preparing",
  "pickupReady",
  "inDelivery",
  "completed",
  "delayed",
  "onHold",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const categories = [
  "retractable",
  "bioclimatic",
  "slidingGlass",
  "tripleglass",
  "screenZip",
  "other",
] as const;
export type Category = (typeof categories)[number];
export type Product = {
  id: string;
  name: DemoText;
  category: Category;
  model: string;
  description: DemoText;
  options: string;
  image?: string;
  active: boolean;
};
export type OrderItem = {
  configuration?: SystemConfiguration;
  preview?: string;
  id: string;
  productId: string;
  model: string;
  quantity: number;
  width: number;
  projection: number;
  height: number;
  colour: string;
  motor: string;
  lighting: boolean;
  options: string;
  notes: string;
};
export type Dealer = {
  discountPercent?: number;
  id: string;
  name: string;
  vat: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  active: boolean;
};
export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  dealerId: string;
  title?: DemoText;
  active: boolean;
};
export type Order = {
  customerOffer?: import("../features/configurator/customer-offer").CustomerOfferSettings;
  customerLogo?: string;
  pricing?: import("../features/configurator/pricing-types").OrderPricing;
  address?: string;
  county?: string;
  localityId?: string;
  id: string;
  dealerId: string;
  name: DemoText;
  clientRef: string;
  city: string;
  country: string;
  notes: DemoText;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  internalStatus: string;
  expectedDate: string;
  pickupDate: string;
  deliveryDate: string;
  installationDate: string;
  delay?: {
    reason: TextKey;
    explanation: DemoText;
    internal: DemoText;
    date: string;
  };
  actionRequired?: DemoText;
};
export const offerStatuses = [
  "draft",
  "offerAvailable",
  "awaitingApproval",
  "accepted",
  "modificationRequested",
  "expired",
] as const;
export type OfferStatus = (typeof offerStatuses)[number];
export type OfferItem = {
  id: string;
  description: DemoText;
  quantity: number;
  price: string;
};
export type Offer = {
  id: string;
  orderId: string;
  date: string;
  validUntil: string;
  revision: number;
  status: OfferStatus;
  items: OfferItem[];
  notes: DemoText;
};
export type DemoDocument = {
  size?: number;
  generated?: boolean;
  id: string;
  orderId?: string;
  productId: string;
  title: DemoText;
  description: DemoText;
  category: Category;
  fileName: string;
  url: string;
  mime: string;
  visible: boolean;
  archived: boolean;
  date: string;
};
export type Update = {
  id: string;
  orderId: string;
  author: DemoRole;
  body: DemoText;
  internal: boolean;
  type:
    | "message"
    | "requestOffer"
    | "requestChange"
    | "sendInfo"
    | "internalNote";
  resolved: boolean;
  date: string;
};
export type Notification = {
  id: string;
  orderId: string;
  text: DemoText;
  read: boolean;
  date: string;
};
export type Activity = {
  id: string;
  user: string;
  role: DemoRole;
  action: TextKey;
  orderId?: string;
  date: string;
  internal: boolean;
};
export type DemoState = {
  pricingPolicy?: import("../features/configurator/pricing-types").PricePolicy;
  orders: Order[];
  dealers: Dealer[];
  users: DemoUser[];
  products: Product[];
  offers: Offer[];
  documents: DemoDocument[];
  updates: Update[];
  notifications: Notification[];
  activity: Activity[];
};
