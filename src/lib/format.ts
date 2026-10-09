import type { Locale } from "./i18n";

const localeTags: Record<Locale, string> = {
  ro: "ro-RO", en: "en-GB", it: "it-IT", es: "es-ES",
  de: "de-DE", hu: "hu-HU", fr: "fr-FR",
};

export function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(value));
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(localeTags[locale]).format(value);
}
