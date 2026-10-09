import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { withBasePath } from "../../lib/base-path";
import { getCopy } from "./locales";
import { isRoof, modelFor } from "./catalog";
import { systemRows } from "./summary";
import { formatPrice } from "./pricing";
import type { CustomerBrand, CustomerOffer } from "./customer-offer";
import type { ConfigLocale, ConfiguratorDraft } from "./types";

/** Deliberately accepts only customer-facing prices, never the dealer pricing snapshot. */
export async function generateCustomerReport(
  draft: ConfiguratorDraft,
  offer: CustomerOffer,
  brand: CustomerBrand,
  images: Record<string, string>,
  locale: ConfigLocale,
  assetBase = withBasePath("/configurator"),
  reference = "",
) {
  if (!brand.name.trim()) throw Error("Missing dealer company");
  const t = getCopy(locale),
    pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const response = await fetch(assetBase + "/NotoSans-Regular.ttf");
  if (!response.ok) throw Error("Font unavailable");
  const font = await pdf.embedFont(await response.arrayBuffer(), {
    subset: true,
  });
  const logo = brand.logoDataUrl ? await pdf.embedPng(brand.logoDataUrl) : null;
  pdf.setTitle(`${t.customerOffer} · ${draft.client.name}`);
  pdf.setAuthor(brand.name);
  pdf.setSubject(t.customerOffer);
  pdf.setLanguage(locale);
  const ink = rgb(0.12, 0.17, 0.16),
    muted = rgb(0.4, 0.44, 0.42),
    pale = rgb(0.96, 0.965, 0.95),
    gold = rgb(0.69, 0.49, 0.23);
  const clean = (s: string) =>
    s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  let page!: PDFPage;
  let y = 0;
  function wrap(value: string, size: number, width: number) {
    const result: string[] = [];
    for (const paragraph of clean(value).split(/\r?\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (
          font.widthOfTextAtSize((line ? line + " " : "") + word, size) <= width
        ) {
          line += (line ? " " : "") + word;
          continue;
        }
        if (line) result.push(line);
        line = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) {
            result.push(line);
            line = "";
          }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  }
  function text(
    value: string,
    x: number,
    baseline: number,
    size = 10,
    color = ink,
  ) {
    page.drawText(clean(value), { x, y: baseline, size, font, color });
  }
  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    if (logo) {
      const scale = Math.min(210 / logo.width, 55 / logo.height);
      page.drawImage(logo, {
        x: 36,
        y: 776,
        width: logo.width * scale,
        height: logo.height * scale,
      });
    } else {
      const names = wrap(brand.name, 17, 285);
      names.slice(0, 2).forEach((line, i) => text(line, 36, 809 - i * 21, 17));
    }
    const ref = wrap(reference || draft.client.date, 9, 205)[0];
    text(ref, 559 - font.widthOfTextAtSize(ref, 9), 803, 9, gold);
    const label = wrap(t.customerOffer, 8, 205)[0];
    text(label, 559 - font.widthOfTextAtSize(label, 8), 786, 8, muted);
    page.drawLine({
      start: { x: 36, y: 764 },
      end: { x: 559, y: 764 },
      color: gold,
      thickness: 1,
    });
    y = 730;
  }
  function ensure(height: number) {
    if (y - height < 64) newPage();
  }
  function paragraph(value: string, size = 10, color = ink) {
    for (const line of wrap(value, size, 523)) {
      ensure(size + 6);
      text(line, 36, y, size, color);
      y -= size + 5;
    }
    y -= 7;
  }
  function fields(rows: [string, string][], columns = 2) {
    const width = (523 - (columns - 1) * 10) / columns;
    const labelSize = columns === 3 ? 7 : 7.5;
    const valueSize = columns === 3 ? 9 : 10;
    for (let i = 0; i < rows.length; i += columns) {
      const pair = rows.slice(i, i + columns).map(([label, value]) => ({
        label: wrap(label, labelSize, width - 18),
        value: wrap(value || "—", valueSize, width - 18),
      }));
      const height =
        Math.max(
          ...pair.map((p) => p.label.length * 10 + p.value.length * 14),
        ) + 18;
      ensure(height + 6);
      pair.forEach((p, j) => {
        const x = 36 + j * (width + 10);
        page.drawRectangle({
          x,
          y: y - height + 4,
          width,
          height,
          color: pale,
        });
        p.label.forEach((line, n) =>
          text(line, x + 9, y - 10 - n * 10, labelSize, muted),
        );
        p.value.forEach((line, n) =>
          text(line, x + 9, y - p.label.length * 10 - 13 - n * 14, valueSize),
        );
      });
      y -= height + 6;
    }
    y -= 8;
  }
  const money = (n: number | null) =>
    n == null ? t.priceOnRequest : formatPrice(n, locale, offer.currency);
  const percent = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(offer.discountPercent);
  function amount(label: string, value: string, total = false) {
    const values = wrap(value, 10, 208),
      labels = wrap(label, 9, 265);
    const height = Math.max(labels.length, values.length) * 14 + 16;
    ensure(height + 5);
    if (total)
      page.drawRectangle({
        x: 36,
        y: y - height + 12,
        width: 523,
        height,
        color: ink,
      });
    labels.forEach((line, i) =>
      text(line, 46, y - i * 14, 9, total ? rgb(1, 1, 1) : muted),
    );
    values.forEach((line, i) =>
      text(
        line,
        549 - font.widthOfTextAtSize(line, 10),
        y - i * 14,
        10,
        total ? rgb(1, 1, 1) : ink,
      ),
    );
    y -= height + 5;
  }
  const discountLabel = `${t.customerDiscount} · ${percent}%`;
  newPage();
  paragraph(t.customerOffer, 25);
  paragraph(t.demoPrices, 9, muted);
  paragraph(brand.name, 11, muted);
  fields([
    [t.name, draft.client.name],
    [
      t.date,
      new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(draft.client.date + "T12:00:00"),
      ),
    ],
    [t.address, draft.client.address],
    [
      t.city,
      [draft.client.city, draft.client.county].filter(Boolean).join(", "),
    ],
    [
      t.country,
      new Intl.DisplayNames(locale, { type: "region" }).of(
        draft.client.country,
      ) || draft.client.country,
    ],
    ...(draft.client.reference
      ? [[t.reference, draft.client.reference] as [string, string]]
      : []),
  ]);
  paragraph(t.systems, 14);
  for (const [i, s] of draft.systems.entries()) {
    const price = offer.lines.find((p) => p.systemId === s.id);
    const name = `${String(i + 1).padStart(2, "0")} · ${modelFor(s.model).name}${s.label ? " · " + s.label : ""}`;
    ensure(82);
    paragraph(name, 11);
    const dims = [
      s.width,
      ...(isRoof(s.model) ? [s.projection] : []),
      s.height,
    ].join(" × ");
    amount(
      `${dims} mm · ${s.quantity} ${t.units}`,
      money(price?.priceCents ?? null),
    );
  }
  ensure(160);
  amount(t.offerPrice, money(offer.priceCents));
  if (offer.discountCents != null)
    amount(discountLabel, "- " + money(offer.discountCents));
  amount(
    offer.partial ? t.offerSubtotal : t.offerFinal,
    money(offer.finalCents),
    true,
  );
  paragraph(
    offer.tax === "excluded"
      ? t.taxExcluded
      : offer.tax === "included"
        ? t.taxIncluded
        : t.taxUnconfirmed,
    9,
    muted,
  );
  if (offer.partial) paragraph(t.offerPartial, 9, muted);
  paragraph(t.offerTerms, 9, muted);
  if (offer.provisional) paragraph(t.provisionalPricing, 8, muted);

  for (const [i, s] of draft.systems.entries()) {
    newPage();
    paragraph(
      `${String(i + 1).padStart(2, "0")} · ${modelFor(s.model).name}`,
      21,
    );
    if (s.label) paragraph(s.label, 11, muted);
    if (!images[s.id]) throw Error("Missing system image");
    const image = await pdf.embedPng(images[s.id]);
    const scale = Math.min(523 / image.width, 215 / image.height);
    ensure(image.height * scale + 32);
    page.drawImage(image, {
      x: (595.28 - image.width * scale) / 2,
      y: y - image.height * scale,
      width: image.width * scale,
      height: image.height * scale,
    });
    y -= image.height * scale + 17;
    paragraph(t.offerImageHint, 8, muted);
    const allowed = new Set([
      t.quantity,
      t.width,
      t.height,
      t.projection,
      t.projectionDouble,
      t.mount,
      t.frameColour,
      t.roofColour,
      t.membrane,
      t.textile,
      t.glass,
      t.panels,
      t.intermediatePosts,
      t.lighting,
      t.ledSpots,
      t.lightTone,
      t.remote,
      t.sheetRoof,
    ]);
    fields(
      systemRows(s, locale).filter(([key]) => allowed.has(key)),
      3,
    );
    const price = offer.lines.find((p) => p.systemId === s.id);
    ensure(130);
    amount(
      t.offerPrice + ` · ${s.quantity} ${t.units}`,
      money(price?.priceCents ?? null),
    );
    if (price?.discountCents != null)
      amount(discountLabel, "- " + money(price.discountCents));
    amount(t.offerFinal, money(price?.finalCents ?? null), true);
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: 36, y: 40 },
      end: { x: 559, y: 40 },
      color: pale,
      thickness: 1,
    });
    p.drawText(wrap(brand.name, 8, 360)[0], {
      x: 36,
      y: 25,
      font,
      size: 8,
      color: muted,
    });
    const value = `${t.page} ${i + 1} / ${pages.length}`;
    p.drawText(value, {
      x: 559 - font.widthOfTextAtSize(value, 8),
      y: 25,
      font,
      size: 8,
      color: muted,
    });
  });
  const filename =
    `${t.customerOffer}-${reference || draft.client.date}`.replace(
      /[<>:"/\\|?*\u0000-\u001f]/g,
      "-",
    );
  return new File([(await pdf.save()) as BlobPart], `${filename}.pdf`, {
    type: "application/pdf",
  });
}
