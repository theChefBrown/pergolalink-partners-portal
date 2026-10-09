"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { messages, type Locale, type Theme } from "@/lib/i18n";
import { portalMessages } from "@/lib/portal-messages";

type Preferences = {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

function savePreference(name: string, value: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function DisplayPreferences({ children, initialLocale, initialTheme }: {
  children: ReactNode; initialLocale: Locale; initialTheme: Theme;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  const [theme, updateTheme] = useState(initialTheme);

  function setLocale(next: Locale) {
    updateLocale(next);
    document.documentElement.lang = next;
    savePreference("pergolalink-locale", next);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    updateTheme(next);
    document.documentElement.dataset.theme = next;
    savePreference("dummy-theme", next);
  }

  return (
    <PreferencesContext value={{ locale, theme, setLocale, toggleTheme }}>
      {/* React keeps these in the document head and in sync across client navigation. */}
      <title>{`PergolaLink | ${messages[locale].portal}`}</title>
      <meta name="description" content={messages[locale].intro} />
      {children}
    </PreferencesContext>
  );
}

export function useDisplayPreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("Display preferences require DisplayPreferences.");
  return { ...value, t: messages[value.locale], ui: portalMessages[value.locale] };
}
