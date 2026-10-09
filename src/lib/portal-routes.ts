import { initialDemoState } from "@/lib/mock-data/platform";

export const portalRoutePattern =
  /^(orders(\/[^/]+)?|offers(\/[^/]+)?|calendar|documentation|notifications|company|manager(\/(dealers(\/[^/]+)?|orders(\/[^/]+)?|offers(\/[^/]+(\/(edit|revision))?)?|requests|updates|calendar|documentation))?|admin(\/(users|dealers(\/[^/]+)?|products|documentation|activity|settings))?)$/;

const fixed = [
  "orders", "orders/new", "offers", "calendar", "documentation", "notifications",
  "company", "manager", "manager/dealers", "manager/orders", "manager/offers",
  "manager/offers/new", "manager/requests", "manager/updates", "manager/calendar",
  "manager/documentation", "admin", "admin/users", "admin/dealers", "admin/products",
  "admin/documentation", "admin/activity", "admin/settings",
];

/** Routes pre-rendered at build time. IDs created later in the browser are served by the 404 fallback. */
export function portalStaticPaths(): string[][] {
  const { orders, offers, dealers } = initialDemoState;
  const routes = [
    ...fixed,
    ...orders.flatMap((o) => [`orders/${o.id}`, `manager/orders/${o.id}`]),
    ...offers.flatMap((o) => [
      `offers/${o.id}`,
      `manager/offers/${o.id}`,
      `manager/offers/${o.id}/edit`,
      `manager/offers/${o.id}/revision`,
    ]),
    ...dealers.flatMap((d) => [`manager/dealers/${d.id}`, `admin/dealers/${d.id}`]),
  ];
  return routes.map((route) => route.split("/"));
}
