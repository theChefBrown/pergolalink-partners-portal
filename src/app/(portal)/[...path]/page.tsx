import { DemoRouter } from "@/components/demo/demo-router";
import { redirect, notFound } from "next/navigation";
export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { path } = await params;
  if (path[0] === "projects")
    redirect(
      "/orders" + (path.length > 1 ? "/" + path.slice(1).join("/") : ""),
    );
  const route = path.join("/");
  const valid =
    /^(orders(\/[^/]+)?|offers(\/[^/]+)?|calendar|documentation|notifications|company|manager(\/(dealers(\/[^/]+)?|orders(\/[^/]+)?|offers(\/[^/]+(\/(edit|revision))?)?|requests|updates|calendar|documentation))?|admin(\/(users|dealers(\/[^/]+)?|products|documentation|activity|settings))?)$/.test(
      route,
    );
  if (!valid) notFound();
  const query = await searchParams;
  return (
    <DemoRouter
      key={route}
      path={path}
      initialOrderId={typeof query.order === "string" ? query.order : undefined}
    />
  );
}
