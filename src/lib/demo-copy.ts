import type { Locale } from "./i18n";
const rows = {
  available: [
    "Deschide demo",
    "Open demo",
    "Apri demo",
    "Abrir demo",
    "Demo öffnen",
    "Demó megnyitása",
    "Ouvrir la démo",
  ],
  banner: [
    "Demo public · firme și prețuri fictive",
    "Public demo · fictional companies and prices",
    "Demo pubblica · aziende e prezzi fittizi",
    "Demo pública · empresas y precios ficticios",
    "Öffentliche Demo · fiktive Firmen und Preise",
    "Nyilvános demó · fiktív cégek és árak",
    "Démo publique · entreprises et prix fictifs",
  ],
  dealer: [
    "Dealer demo",
    "Demo dealer",
    "Rivenditore demo",
    "Distribuidor demo",
    "Demo-Händler",
    "Demó kereskedő",
    "Revendeur démo",
  ],
  reset: [
    "Resetează demo",
    "Reset demo",
    "Ripristina demo",
    "Restablecer demo",
    "Demo zurücksetzen",
    "Demó visszaállítása",
    "Réinitialiser la démo",
  ],
  confirm: [
    "Resetezi comenzile, ofertele și fișierele salvate în acest browser?",
    "Reset orders, quotations and uploaded files saved in this browser?",
    "Ripristinare ordini, preventivi e file salvati in questo browser?",
    "¿Restablecer pedidos, ofertas y archivos guardados en este navegador?",
    "Aufträge, Angebote und Dateien in diesem Browser zurücksetzen?",
    "Visszaállítja a böngészőben mentett rendeléseket, ajánlatokat és fájlokat?",
    "Réinitialiser les commandes, devis et fichiers enregistrés dans ce navigateur ?",
  ],
  saved: [
    "Modificările se păstrează în acest browser.",
    "Changes are saved in this browser.",
    "Le modifiche sono salvate in questo browser.",
    "Los cambios se guardan en este navegador.",
    "Änderungen werden in diesem Browser gespeichert.",
    "A változások ebben a böngészőben tárolódnak.",
    "Les modifications sont enregistrées dans ce navigateur.",
  ],
  storage: [
    "Salvarea locală nu este disponibilă. Modificările se păstrează doar până la reîncărcare.",
    "Local storage is unavailable. Changes last until the page is reloaded.",
    "Salvataggio locale non disponibile. Le modifiche durano fino al ricaricamento.",
    "Guardado local no disponible. Los cambios duran hasta recargar la página.",
    "Lokales Speichern nicht verfügbar. Änderungen bleiben bis zum Neuladen erhalten.",
    "A helyi mentés nem érhető el. A módosítások az újratöltésig maradnak meg.",
    "Enregistrement local indisponible. Les modifications durent jusqu’au rechargement.",
  ],
};
export function demoCopy(locale: Locale) {
  const i = ["ro", "en", "it", "es", "de", "hu", "fr"].indexOf(locale);
  return Object.fromEntries(
    Object.entries(rows).map(([key, values]) => [key, values[Math.max(0, i)]]),
  ) as Record<keyof typeof rows, string>;
}
