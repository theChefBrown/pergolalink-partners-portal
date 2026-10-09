import { Suspense } from "react";
import { DemoRouter } from "@/components/demo/demo-router";
import { portalStaticPaths } from "@/lib/portal-routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return portalStaticPaths().map((path) => ({ path }));
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  return (
    <Suspense>
      <DemoRouter key={path.join("/")} path={path} />
    </Suspense>
  );
}
