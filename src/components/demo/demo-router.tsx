"use client";
import dynamic from "next/dynamic";
const Overview = dynamic(() => import("./overview").then((m) => m.Overview));
const OrderList = dynamic(() =>
  import("./order-list").then((m) => m.OrderList),
);
const OrderDetail = dynamic(() =>
  import("./order-detail").then((m) => m.OrderDetail),
);
const NewOrder = dynamic(() => import("./new-order").then((m) => m.NewOrder));
const OfferList = dynamic(() =>
  import("./offer-pages").then((m) => m.OfferList),
);
const OfferDetail = dynamic(() =>
  import("./offer-pages").then((m) => m.OfferDetail),
);
const OfferEditor = dynamic(() =>
  import("./offer-pages").then((m) => m.OfferEditor),
);
import { MissingPage } from "../missing-page";
const CalendarPage = dynamic(() =>
  import("./calendar-page").then((m) => m.CalendarPage),
);
const DocumentationPage = dynamic(() =>
  import("./documentation-page").then((m) => m.DocumentationPage),
);
const NotificationsPage = dynamic(() =>
  import("./notifications-page").then((m) => m.NotificationsPage),
);
const DealerList = dynamic(() =>
  import("./dealer-pages").then((m) => m.DealerList),
);
const CompanyPage = dynamic(() =>
  import("./dealer-pages").then((m) => m.CompanyPage),
);
const UpdatesPage = dynamic(() =>
  import("./updates-page").then((m) => m.UpdatesPage),
);
const AdminUsers = dynamic(() =>
  import("./admin-users").then((m) => m.AdminUsers),
);
const AdminProducts = dynamic(() =>
  import("./admin-products").then((m) => m.AdminProducts),
);
const AdminActivity = dynamic(() =>
  import("./admin-pages").then((m) => m.AdminActivity),
);
const AdminSettings = dynamic(() =>
  import("./admin-pages").then((m) => m.AdminSettings),
);
export function DemoRouter({
  path,
  initialOrderId,
}: {
  path: string[];
  initialOrderId?: string;
}) {
  const route = path.join("/");
  if (route === "admin/activity") return <AdminActivity />;
  if (route === "admin/settings") return <AdminSettings />;
  if (route === "admin/users") return <AdminUsers />;
  if (route === "admin/products") return <AdminProducts />;
  if (["manager/requests", "manager/updates"].includes(route))
    return <UpdatesPage key={route} requests={path[1] === "requests"} />;
  if (route === "notifications") return <NotificationsPage />;
  if (route === "company") return <CompanyPage />;
  if (["manager/dealers", "admin/dealers"].includes(route))
    return <DealerList admin={path[0] === "admin"} />;
  if (
    ["manager", "admin"].includes(path[0]) &&
    path[1] === "dealers" &&
    path.length === 3
  )
    return <CompanyPage key={route} id={path[2]} admin={path[0] === "admin"} />;
  if (
    ["documentation", "manager/documentation", "admin/documentation"].includes(
      route,
    )
  )
    return (
      <DocumentationPage staff={path.length > 1} admin={path[0] === "admin"} />
    );
  if (route === "calendar" || route === "manager/calendar")
    return <CalendarPage staff={path[0] === "manager"} />;
  if (route === "orders/new") return <NewOrder />;
  if (route === "offers") return <OfferList />;
  if (route === "manager/offers") return <OfferList staff />;
  if (route === "manager/offers/new")
    return <OfferEditor initialOrderId={initialOrderId} />;
  if (path[0] === "offers" && path.length === 2)
    return <OfferDetail id={path[1]} />;
  if (path[0] === "manager" && path[1] === "offers" && path.length === 3)
    return <OfferDetail id={path[2]} staff />;
  if (
    path[0] === "manager" &&
    path[1] === "offers" &&
    path.length === 4 &&
    ["edit", "revision"].includes(path[3])
  )
    return (
      <OfferEditor key={route} id={path[2]} revision={path[3] === "revision"} />
    );
  if (route === "orders") return <OrderList />;
  if (route === "manager/orders") return <OrderList staff />;
  if (path[0] === "orders" && path.length === 2)
    return <OrderDetail id={path[1]} />;
  if (path[0] === "manager" && path[1] === "orders" && path.length === 3)
    return <OrderDetail id={path[2]} staff />;
  if (route === "manager") return <Overview staff />;
  if (route === "admin") return <Overview staff admin />;
  return <MissingPage />;
}
