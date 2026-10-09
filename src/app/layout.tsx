import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DisplayPreferences } from "@/components/display-preferences";
import { resolveLocale } from "@/lib/i18n";
import { SiteFooter } from "@/components/site-controls";
import { LanguagePicker } from "@/components/language-picker";
import { DemoProvider } from "@/components/demo/demo-provider";
import "./globals.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const preferences = await cookies();
  const savedLocale = preferences.get("pergolalink-locale")?.value;
  const locale = resolveLocale(savedLocale);
  const theme = preferences.get("dummy-theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang={locale} data-theme={theme} data-scroll-behavior="smooth">
      <body>
        <DisplayPreferences initialLocale={locale} initialTheme={theme}>
          <DemoProvider>{children}</DemoProvider>
          <SiteFooter />
          <LanguagePicker />
        </DisplayPreferences>
      </body>
    </html>
  );
}
