import { PDFDocument, rgb, degrees, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { withBasePath } from "../../lib/base-path";
import { getCopy } from "./locales";
import { modelFor, isRoof } from "./catalog";
import { systemSections } from "./summary";
import { priceOrder, formatPrice } from "./pricing";
import { priceIssueLabel, priceRows } from "./price-summary";
import type { OrderPricing } from "./pricing-types";
import { systemLayout } from "./layout";
import type { ConfigLocale, ConfiguratorDraft } from "./types";
import { technicalDrawing, type DrawingMark } from "./technical-drawing";

async function photoBytes(file: File) {
  const image = await createImageBitmap(file);
  const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error("image conversion"))),
      "image/jpeg",
      0.86,
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}
export async function generateReport(
  draft: ConfiguratorDraft,
  files: File[],
  images: Record<string, string>,
  locale: ConfigLocale,
  assetBase = withBasePath("/configurator"),
  reference = "",
  pricing: OrderPricing = priceOrder(draft.systems),
  logoUrl = assetBase + "/pergolalink-logo-light.png",
) {
  const t = getCopy(locale),
    pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const response = await fetch(assetBase + "/NotoSans-Regular.ttf");
  if (!response.ok) throw Error("Font unavailable");
  const font = await pdf.embedFont(await response.arrayBuffer(), {
    subset: true,
  });
  const logoResponse = logoUrl ? await fetch(logoUrl) : null;
  const logo = logoResponse?.ok
    ? await pdf.embedPng(await logoResponse.arrayBuffer())
    : null;
  pdf.setTitle(`PergolaLink · ${t.reportTitle} · ${draft.client.name}`);
  pdf.setAuthor("PergolaLink");
  pdf.setSubject(t.reportHint);
  pdf.setLanguage(locale);
  const ink = rgb(0.12, 0.17, 0.16),
    muted = rgb(0.4, 0.44, 0.42),
    pale = rgb(0.96, 0.965, 0.95),
    gold = rgb(0.69, 0.49, 0.23);
  let page!: PDFPage,
    y = 0,
    sectionLabel = t.reportTitle;
  const clean = (s: string) =>
    s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  function wrap(text: string, size: number, width: number) {
    const lines: string[] = [];
    for (const paragraph of clean(text).split(/\r?\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (
          font.widthOfTextAtSize((line ? line + " " : "") + word, size) <= width
        ) {
          line += (line ? " " : "") + word;
          continue;
        }
        if (line) lines.push(line);
        line = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) {
            lines.push(line);
            line = "";
          }
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
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
  function newPage(label = t.reportTitle) {
    sectionLabel = label;
    page = pdf.addPage([595.28, 841.89]);
    if (logo)
      page.drawImage(logo, {
        x: 36,
        y: 779,
        width: 170,
        height: (170 * logo.height) / logo.width,
      });
    else text("PERGOLALINK", 36, 793, 22);
    const ref = reference || draft.client.date;
    text(ref, 559 - font.widthOfTextAtSize(ref, 9), 804, 9, gold);
    const clientName = wrap(draft.client.name, 8, 265)[0];
    text(
      clientName,
      559 - font.widthOfTextAtSize(clientName, 8),
      788,
      8,
      muted,
    );
    page.drawLine({
      start: { x: 36, y: 764 },
      end: { x: 559, y: 764 },
      color: gold,
      thickness: 1,
    });
    text(wrap(label, 8, 523)[0], 36, 747, 8, muted);
    y = 720;
  }
  function ensure(height: number) {
    if (y - height < 64) {
      newPage(sectionLabel);
    }
  }
  function paragraph(value: string, size = 10, color = ink, width = 523) {
    for (const line of wrap(value, size, width)) {
      ensure(size + 8);
      text(line, 36, y, size, color);
      y -= size + 5;
    }
    y -= 5;
  }
  function heading(value: string) {
    ensure(40);
    y -= 7;
    text(value, 36, y, 13);
    y -= 26;
  }
  function fields(rows: [string, string][], columns = 2) {
    const width = (523 - (columns - 1) * 10) / columns,
      size = columns === 3 ? 9 : 10;
    for (let i = 0; i < rows.length; i += columns) {
      const pair = rows.slice(i, i + columns),
        lineSets = pair.map((r) => wrap(r[1] || "—", size, width - 18)),
        labelSets = pair.map((r) => wrap(r[0], 7.5, width - 18)),
        labelHeight = Math.max(...labelSets.map((v) => v.length)) * 10,
        height =
          Math.max(...lineSets.map((v) => v.length)) * 13 + labelHeight + 12;
      ensure(height + 5);
      pair.forEach((_, j) => {
        const x = 36 + j * (width + 10);
        page.drawRectangle({
          x,
          y: y - height + 4,
          width,
          height,
          color: pale,
        });
        labelSets[j].forEach((line, k) =>
          text(line, x + 9, y - 8 - k * 10, 7.5, muted),
        );
        lineSets[j].forEach((line, k) =>
          text(line, x + 9, y - labelHeight - 10 - k * 13, size),
        );
      });
      y -= height + 5;
    }
  }
  function specificationTable(title: string, rows: [string, string][]) {
    // Reserve the section title and its first pair to avoid orphan headings.
    ensure(62);
    y -= 7;
    text(title, 36, y, 10, gold);
    y -= 18;
    for (let i = 0; i < rows.length; i += 2) {
      const pair = rows.slice(i, i + 2);
      const content = pair.map(([key, value]) => ({
        labels: wrap(key, 7, 238),
        values: wrap(value, 9, 238),
      }));
      const height =
        Math.max(
          ...content.map((c) => c.labels.length * 9 + c.values.length * 12),
        ) + 13;
      ensure(height);
      content.forEach((c, index) => {
        const x = 36 + index * 267;
        page.drawLine({
          start: { x, y: y + 3 },
          end: { x: x + 256, y: y + 3 },
          color: pale,
          thickness: 1,
        });
        c.labels.forEach((line, n) => text(line, x, y - 7 - n * 9, 7, muted));
        c.values.forEach((line, n) =>
          text(line, x, y - c.labels.length * 9 - 9 - n * 12, 9),
        );
      });
      y -= height;
    }
    y -= 4;
  }
  function commercialRows(rows: [string, string][]) {
    for (const [index, [label, value]] of rows.entries()) {
      const labels = wrap(label, 9, 330);
      ensure(labels.length * 13 + 22);
      const total = index === rows.length - 1;
      if (total) {
        page.drawRectangle({
          x: 36,
          y: y - labels.length * 13 + 1,
          width: 523,
          height: labels.length * 13 + 15,
          color: ink,
        });
        page.drawRectangle({
          x: 36,
          y: y - labels.length * 13 + 1,
          width: 3,
          height: labels.length * 13 + 15,
          color: gold,
        });
      }
      labels.forEach((line, n) =>
        text(
          line,
          total ? 47 : 36,
          y - n * 13,
          9,
          total ? rgb(1, 1, 1) : muted,
        ),
      );
      text(
        value,
        (total ? 548 : 559) - font.widthOfTextAtSize(value, 10),
        y,
        10,
        total ? rgb(1, 1, 1) : ink,
      );
      y -= labels.length * 13 + (total ? 20 : 10);
    }
  }
  function drawing(
    marks: DrawingMark[],
    left: number,
    top: number,
    scale: number,
  ) {
    const colour = (hex: string) =>
      rgb(
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      );
    for (const mark of marks) {
      const x = left + mark.x * scale,
        dy = top - mark.y * scale;
      if (mark.kind === "line")
        page.drawLine({
          start: { x, y: dy },
          end: { x: left + mark.x2 * scale, y: top - mark.y2 * scale },
          thickness: mark.weight * scale,
          color: colour(mark.colour),
        });
      else if (mark.kind === "rect")
        page.drawRectangle({
          x,
          y: dy - mark.height * scale,
          width: mark.width * scale,
          height: Math.max(0, mark.height * scale),
          borderWidth: mark.weight * scale,
          borderColor: colour(mark.colour),
          color: colour(mark.fill),
        });
      else if (mark.kind === "circle")
        page.drawCircle({
          x,
          y: dy,
          size: mark.radius * scale,
          borderWidth: mark.weight * scale,
          borderColor: colour(mark.colour),
          color: colour(mark.fill),
        });
      else {
        const size = mark.size * scale,
          offset =
            mark.anchor === "middle"
              ? font.widthOfTextAtSize(mark.value, size) / 2
              : 0;
        page.drawText(mark.value, {
          x: x - (mark.vertical ? 0 : offset),
          y: dy - (mark.vertical ? offset : 0),
          size,
          font,
          color: colour(mark.colour),
          rotate: degrees(mark.vertical ? 90 : 0),
        });
      }
    }
  }
  newPage();
  paragraph(t.orderSummary, 26);
  paragraph(t.demoPrices, 9, muted);
  paragraph(t.productionReview, 9, muted);
  const client = draft.client;
  fields([
    ...(pricing.dealer
      ? [[t.dealerCompany, pricing.dealer.name] as [string, string]]
      : []),
    [t.name, client.name],
    [t.reference, client.reference],
    [
      t.date,
      new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(client.date + "T12:00:00"),
      ),
    ],
    [
      t.country,
      new Intl.DisplayNames([locale], { type: "region" }).of(client.country) ??
        client.country,
    ],
    [t.address, client.address],
    [t.city, [client.city, client.county].filter(Boolean).join(", ")],
  ]);
  heading(t.commercialSummary);
  for (let i = 0; i < draft.systems.length; i++) {
    const s = draft.systems[i];
    const p = pricing.systems.find((p) => p.systemId === s.id);
    ensure(74);
    paragraph(
      `${String(i + 1).padStart(2, "0")}  ${modelFor(s.model).name}${s.label ? " · " + s.label : ""}`,
      11,
      ink,
      365,
    );
    const dims = [s.width, isRoof(s.model) ? s.projection : 0, s.height]
      .filter(Boolean)
      .join(" × ");
    text(`${dims} mm  ·  ${s.quantity} ${t.units}`, 36, y, 9, muted);
    const amount =
      p?.listCents == null
        ? t.priceOnRequest
        : formatPrice(p.listCents, locale, pricing.currency);
    text(amount, 559 - font.widthOfTextAtSize(amount, 10), y + 20, 10);
    y -= 17;
    if (p?.status === "partial")
      paragraph(
        p?.issues.length
          ? p.issues.map((issue) => priceIssueLabel(issue, locale)).join(" ")
          : t.priceOnRequest,
        8,
        muted,
      );
    page.drawLine({
      start: { x: 36, y: y - 1 },
      end: { x: 559, y: y - 1 },
      thickness: 0.5,
      color: pale,
    });
    y -= 14;
  }
  ensure(150);
  commercialRows(priceRows(pricing, pricing, locale));
  paragraph(
    pricing.tax === "excluded"
      ? t.taxExcluded
      : pricing.tax === "included"
        ? t.taxIncluded
        : t.taxUnconfirmed,
    9,
    muted,
  );
  if (!pricing.currency) paragraph(t.currencyUnconfirmed, 8, muted);
  if (pricing.status !== "complete") paragraph(t.partialPricingHint, 8, muted);
  paragraph(t.equipmentPricingHint, 8, muted);
  if (pricing.provisional) paragraph(t.provisionalPricing, 8, muted);
  paragraph(`${t.priceVersion}: ${pricing.policyVersion}`, 8, muted);
  if (client.notes) {
    heading(t.notes);
    paragraph(client.notes);
  }
  if (files.length)
    paragraph(
      `${t.photos}: ${files.length} · ${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(files.reduce((n, f) => n + f.size, 0) / 1024 / 1024)} MB`,
      9,
      muted,
    );
  for (let i = 0; i < draft.systems.length; i++) {
    const s = draft.systems[i];
    const systemLabel = `${String(i + 1).padStart(2, "0")} · ${modelFor(s.model).name}${s.label ? " · " + s.label : ""}`;
    newPage(systemLabel);
    heading(`${String(i + 1).padStart(2, "0")}  ${modelFor(s.model).name}`);
    if (s.label) paragraph(s.label, 11, muted);
    if (!images[s.id]) throw Error("Missing system image");
    const image = await pdf.embedPng(images[s.id]);
    const height = Math.min(250, (523 * image.height) / image.width),
      width = (height * image.width) / image.height;
    page.drawImage(image, {
      x: (595.28 - width) / 2,
      y: y - height,
      width,
      height,
    });
    y -= height + 20;
    fields(
      [
        [t.quantity, String(s.quantity)],
        [t.width, `${s.width} mm`],
        [t.height, `${s.height} mm`],
        ...(isRoof(s.model)
          ? [
              [
                s.mount === "double" ? t.projectionDouble : t.projection,
                `${s.projection} mm`,
              ] as [string, string],
            ]
          : []),
      ],
      3,
    );
    const systemPrice = pricing.systems.find((p) => p.systemId === s.id);
    heading(t.commercialSummary);
    if (systemPrice) {
      commercialRows(priceRows(systemPrice, pricing, locale));
      systemPrice.issues.forEach((issue) =>
        paragraph(priceIssueLabel(issue, locale), 8, muted),
      );
    } else paragraph(t.priceOnRequest, 10);
    if (pricing.dimensionRule !== "exact")
      paragraph(
        pricing.dimensionRule === "ceiling"
          ? t.ceilingPricing
          : t.interpolatedPricing,
        8,
        muted,
      );
    newPage(`${systemLabel} · ${t.productionSheet}`);
    paragraph(t.productionSheet, 19);
    paragraph(
      `${modelFor(s.model).name} · ${s.quantity} ${t.units}${s.label ? " · " + s.label : ""}`,
      10,
      muted,
    );
    for (const group of systemSections(s, locale))
      specificationTable(group.title, group.rows);
    if (s.notes) {
      heading(t.notes);
      paragraph(s.notes);
    }
    if (s.mount === "double") paragraph(t.doubleHint, 8, muted);
    if (modelFor(s.model).kind === "retractable" || s.model === "wintergarden")
      paragraph(t.slopeHint, 8, muted);
    paragraph(t.productionReview, 8, muted);
    paragraph(t.colourHint, 8, muted);
    newPage(`${systemLabel} · ${t.technicalDrawing}`);
    heading(`${String(i + 1).padStart(2, "0")}  ${modelFor(s.model).name}`);
    if (s.label) paragraph(s.label, 10, muted);
    paragraph(
      `${s.width} × ${isRoof(s.model) ? systemLayout(s).depth + " × " : ""}${s.height} mm · ${s.quantity} ${t.units}`,
      10,
      muted,
    );
    ensure(540);
    const top = y;
    drawing(technicalDrawing(s, locale, "frontView"), 36, top, 0.49);
    drawing(technicalDrawing(s, locale, "sideView"), 304, top, 0.49);
    page.drawLine({
      start: { x: 36, y: top - 185 },
      end: { x: 559, y: top - 185 },
      color: pale,
      thickness: 1,
    });
    drawing(technicalDrawing(s, locale, "topView"), 61, top - 197, 0.9);
    y = top - 524;
    if (systemLayout(s).frontPosts.extra.length)
      paragraph(
        `${t.intermediatePosts}: ${systemLayout(s).frontPosts.extra.length} · ${t.postPosition} (P1, P2…)`,
        8,
        rgb(0.65, 0.38, 0.15),
      );
    paragraph(t.drawingHint, 8, muted);
  }
  if (files.length) {
    newPage(t.photos);
    heading(t.photos);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const jpg = await pdf.embedJpg(await photoBytes(file)),
          scale = Math.min(523 / jpg.width, 430 / jpg.height),
          height = jpg.height * scale;
        ensure(height + 60);
        paragraph(file.name, 10);
        page.drawImage(jpg, {
          x: 36,
          y: y - height,
          width: jpg.width * scale,
          height,
        });
        y -= height + 22;
      } else {
        ensure(70);
        paragraph(file.name, 11);
        paragraph(`${(file.size / 1024 / 1024).toFixed(2)} MB · PDF`, 9, muted);
        await pdf.attach(await file.arrayBuffer(), file.name, {
          mimeType: file.type,
          description: file.name,
        });
      }
    }
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: 36, y: 40 },
      end: { x: 559, y: 40 },
      color: rgb(0.83, 0.87, 0.84),
      thickness: 0.6,
    });
    p.drawText(`PERGOLALINK  ·  ${reference || client.date}`, {
      x: 36,
      y: 25,
      size: 8,
      font,
      color: muted,
    });
    const footer = `${t.page} ${i + 1} / ${pages.length}`;
    p.drawText(footer, {
      x: 559 - font.widthOfTextAtSize(footer, 8),
      y: 25,
      size: 8,
      font,
      color: muted,
    });
  });
  const bytes = await pdf.save();
  return new File(
    [bytes as BlobPart],
    `PergolaLink-${reference || client.date}-configurare.pdf`,
    { type: "application/pdf" },
  );
}
