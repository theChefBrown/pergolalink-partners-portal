import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Offer, Order } from "./demo-types";
import type { Locale } from "./i18n";
import { getCopy } from "../features/configurator/locales";
import { demoCopy } from "./demo-copy";
import type { DemoText } from "./workflow-messages";

/** Manager quotations export their actual edited line items, not a placeholder PDF. */
export async function offerReport(
  offer: Offer,
  order: Order,
  locale: Locale,
  text: (v: DemoText) => string,
) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const response = await fetch("/configurator/NotoSans-Regular.ttf");
  if (!response.ok) throw Error("Font unavailable");
  const font = await pdf.embedFont(await response.arrayBuffer(), {
    subset: true,
  });
  const t = getCopy(locale),
    ink = rgb(0.13, 0.21, 0.17),
    muted = rgb(0.4, 0.45, 0.42);
  const clean = (value: string) => value.replace(/[\u0000-\u001f]/g, " ");
  let page = pdf.addPage([595, 842]),
    y = 780;
  function line(value: string, size = 11, color = ink) {
    let remaining = clean(value);
    while (remaining) {
      let length = remaining.length;
      while (
        font.widthOfTextAtSize(remaining.slice(0, length), size) > 515 &&
        length > 1
      )
        length--;
      if (y < 65) {
        page = pdf.addPage([595, 842]);
        y = 780;
      }
      page.drawText(remaining.slice(0, length), {
        x: 40,
        y,
        font,
        size,
        color,
      });
      y -= size + 9;
      remaining = remaining.slice(length);
    }
  }
  pdf.setTitle(offer.id);
  pdf.setAuthor("PergolaLink");
  pdf.setLanguage(locale);
  const logoResponse = await fetch("/configurator/pergolalink-logo-light.png");
  if (logoResponse.ok) {
    const logo = await pdf.embedPng(await logoResponse.arrayBuffer());
    page.drawImage(logo, { x: 40, y: 778, width: 180, height: 180 * logo.height / logo.width });
    y = 750;
  } else {
    line("PergolaLink", 22);
  }
  line(demoCopy(locale).banner, 9, muted);
  y -= 10;
  line(`${offer.id} · ${t.reference}: ${order.id}`, 14);
  line(text(order.name));
  line(`${t.date}: ${offer.date} · ${offer.validUntil}`, 10, muted);
  y -= 12;
  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(n / 100);
  let total = 0,
    complete = true;
  for (const [i, item] of offer.items.entries()) {
    line(`${i + 1}. ${text(item.description)}`, 12);
    const cents =
      item.price.trim() &&
      Number.isFinite(Number(item.price)) &&
      Number(item.price) >= 0
        ? Math.round(Number(item.price) * 100)
        : null;
    if (cents == null) {
      complete = false;
      line(t.priceOnRequest, 10, muted);
    } else {
      total += cents * item.quantity;
      line(
        `${item.quantity} × ${money(cents)} = ${money(cents * item.quantity)}`,
        11,
      );
    }
    y -= 10;
  }
  line(`${complete ? t.offerFinal : t.offerSubtotal}: ${money(total)}`, 15);
  line(t.taxExcluded, 9, muted);
  if (offer.notes) {
    y -= 10;
    line(text(offer.notes));
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(`${t.page} ${i + 1} / ${pages.length}`, {
      x: 40,
      y: 30,
      font,
      size: 8,
      color: muted,
    }),
  );
  return new File([(await pdf.save()) as BlobPart], `${offer.id}.pdf`, {
    type: "application/pdf",
  });
}
