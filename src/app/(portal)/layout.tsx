import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/portal-shell";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
