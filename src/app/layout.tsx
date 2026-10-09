import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DisplayPreferences } from "@/components/display-preferences";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { SiteFooter } from "@/components/site-controls";
import { LanguagePicker } from "@/components/language-picker";
import { DemoProvider } from "@/components/demo/demo-provider";
import "./globals.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Static export: saved language and theme are applied on the client after load.
const applySavedTheme = `try{var m=document.cookie.match(/(?:^|; )dummy-theme=(light|dark)/);if(m)document.documentElement.dataset.theme=m[1]}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={DEFAULT_LOCALE} data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySavedTheme }} />
      </head>
      <body>
        <DisplayPreferences initialLocale={DEFAULT_LOCALE} initialTheme="dark">
          <DemoProvider>{children}</DemoProvider>
          <SiteFooter />
          <LanguagePicker />
        </DisplayPreferences>
      </body>
    </html>
  );
}