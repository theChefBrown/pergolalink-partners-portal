import type { Dealer, DemoUser } from "../demo-types";
export const defaultDealerId = "demo-aurora";
// Invented companies and reserved .example contacts; never imported customer data.
export const dealers: Dealer[] = [
  ["demo-aurora", "Aurora Demo Studio", "Brașov", "RO", 5],
  ["demo-maple", "Maple Demo Outdoor", "Cluj-Napoca", "RO", 10],
  ["demo-riviera", "Riviera Demo Living", "Torino", "IT", 12],
  ["demo-nord", "Nord Demo Terraces", "Berlin", "DE", 15],
  ["demo-sol", "Sol Demo Spaces", "Valencia", "ES", 8],
].map(([id, name, city, country, discount], i) => ({
  id: String(id),
  name: String(name),
  city: String(city),
  country: String(country),
  discountPercent: Number(discount),
  vat: `DEMO-TAX-${i + 1}`,
  address: `Demo Street ${i + 1}`,
  phone: `DEMO-000${i + 1}`,
  email: `contact@${id}.example`,
  website: `https://${id}.example`,
  active: true,
}));
export const users: DemoUser[] = [
  ...dealers.map((d, i) => ({
    id: `demo-user-${i + 1}`,
    name: `Demo Partner ${i + 1}`,
    email: `partner@${d.id}.example`,
    role: "dealer" as const,
    dealerId: d.id,
    title: { key: "companyAdmin" as const },
    active: true,
  })),
  {
    id: "demo-manager",
    name: "Demo Manager",
    email: "manager@dummy-portal.example",
    role: "manager",
    dealerId: "",
    active: true,
  },
  {
    id: "demo-admin",
    name: "Demo Administrator",
    email: "admin@dummy-portal.example",
    role: "admin",
    dealerId: "",
    active: true,
  },
];
