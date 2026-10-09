import { Brand, ThemeToggle } from "@/components/site-controls";
import { MissingPage } from "@/components/missing-page";

export default function NotFound() {
  return <div className="site-shell"><header className="site-header"><div className="page-container portal-header"><Brand /><ThemeToggle /></div></header><main className="page-container not-found-page"><MissingPage /></main></div>;
}
