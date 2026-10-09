"use client";
/* eslint-disable @next/next/no-img-element -- Local dealer logo preview. */
import { useId, useState } from "react";
import {
  calculateCustomerOffer,
  defaultCustomerOffer,
  type CustomerBrand,
  type CustomerOfferSettings,
  type CustomerOffer,
} from "./customer-offer";
import { withBasePath } from "../../lib/base-path";
import { getCopy } from "./locales";
import { formatPrice } from "./pricing";
import type { OrderPricing } from "./pricing-types";
import type { ConfigLocale, ConfiguratorDraft } from "./types";
import { CIcon } from "./ui";
import "./customer-offer.css";

export function CustomerOfferPanel({
  pricing,
  draft,
  brand,
  getImages,
  locale,
  reference = "",
  assetBase = withBasePath("/configurator"),
  initialSettings,
  disabled,
  onSettingsChange,
  onLogoChange,
  onBusyChange,
  onExported,
}: {
  pricing: OrderPricing;
  draft: ConfiguratorDraft;
  brand: CustomerBrand;
  getImages: () => Promise<Record<string, string>>;
  locale: ConfigLocale;
  reference?: string;
  assetBase?: string;
  initialSettings?: CustomerOfferSettings;
  disabled?: boolean;
  onSettingsChange?: (settings: CustomerOfferSettings) => void;
  onLogoChange?: (logo: string | undefined) => void;
  onBusyChange?: (busy: boolean) => void;
  onExported?: (
    settings: CustomerOfferSettings,
    logo: string | undefined,
  ) => void;
}) {
  const t = getCopy(locale),
    id = useId();
  const [settings, setSettings] = useState(
    initialSettings ?? defaultCustomerOffer,
  );
  const [logo, setLogo] = useState(brand.logoDataUrl);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  let offer: CustomerOffer | undefined;
  try {
    offer = calculateCustomerOffer(pricing, settings);
  } catch {
    /* Validation displayed below. */
  }
  const money = (cents: number | null) =>
    cents == null
      ? t.priceOnRequest
      : formatPrice(cents, locale, pricing.currency);
  function change(next: CustomerOfferSettings) {
    setSettings(next);
    setError("");
    onSettingsChange?.(next);
  }
  function changeLogo(next?: string) {
    setLogo(next);
    onLogoChange?.(next);
  }
  function working(value: boolean) {
    setBusy(value);
    onBusyChange?.(value);
  }
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    working(true);
    try {
      if (
        !["image/png", "image/jpeg"].includes(file.type) ||
        file.size > 2 * 1024 * 1024
      )
        throw Error("logo");
      const bitmap = await createImageBitmap(file);
      try {
        if (bitmap.width * bitmap.height > 25_000_000) throw Error("logo");
        const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        changeLogo(canvas.toDataURL("image/png"));
      } finally {
        bitmap.close();
      }
    } catch {
      setError(t.dealerLogoError);
    } finally {
      working(false);
    }
  }
  async function download() {
    if (busy || disabled || !offer) return;
    working(true);
    setError("");
    try {
      const [images, { generateCustomerReport }] = await Promise.all([
        getImages(),
        import("./customer-report"),
      ]);
      const report = await generateCustomerReport(
        draft,
        offer,
        { name: brand.name, logoDataUrl: logo },
        images,
        locale,
        assetBase,
        reference,
      );
      const url = URL.createObjectURL(report),
        link = document.createElement("a");
      link.href = url;
      link.download = report.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      onExported?.(settings, logo);
    } catch {
      setError(t.reportError);
    } finally {
      working(false);
    }
  }
  return (
    <section
      className="customer-offer-panel"
      aria-labelledby={id + "-title"}
      aria-busy={busy}
    >
      <div className="customer-offer-heading">
        <CIcon name="document" />
        <h3 id={id + "-title"}>{t.customerOffer}</h3>
      </div>
      <p className="customer-offer-help">{t.offerHelp}</p>
      <fieldset disabled={busy || disabled}>
        {(["markup", "discount"] as const).map((key) => (
          <div className="customer-adjustment" key={key}>
            <label htmlFor={id + key}>
              {key === "markup" ? t.customerMarkup : t.customerDiscount}
            </label>
            <div className="customer-adjustment-inputs">
              <input
                id={id + key}
                type="number"
                min={0}
                max={
                  key === "discount" && settings[key].mode === "percent"
                    ? 100
                    : undefined
                }
                step="0.01"
                value={
                  Number.isNaN(settings[key].value) ? "" : settings[key].value
                }
                onChange={(e) =>
                  change({
                    ...settings,
                    [key]: {
                      ...settings[key],
                      value:
                        e.target.value === "" ? NaN : Number(e.target.value),
                    },
                  })
                }
              />
              <select
                aria-label={`${key === "markup" ? t.customerMarkup : t.customerDiscount} · ${t.adjustmentMode}`}
                value={settings[key].mode}
                onChange={(e) =>
                  change({
                    ...settings,
                    [key]: {
                      ...settings[key],
                      mode: e.target.value as "percent" | "amount",
                    },
                  })
                }
              >
                <option value="percent">{t.percentage}</option>
                <option value="amount">
                  {t.fixedAmount}
                  {pricing.currency ? ` (${pricing.currency})` : ""}
                </option>
              </select>
            </div>
          </div>
        ))}
        <details className="customer-logo">
          <summary>{t.dealerLogo}</summary>
          <p>{t.dealerLogoHint}</p>
          <input
            aria-label={t.dealerLogo}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {logo && (
            <>
              <img src={logo} alt={brand.name} />
              <button type="button" onClick={() => changeLogo()}>
                {t.removeLogo}
              </button>
            </>
          )}
        </details>
      </fieldset>
      <p className="customer-brand-name">
        {t.dealerCompany}: <strong>{brand.name}</strong>
      </p>
      {offer && (
        <div className="customer-offer-totals" aria-live="polite">
          <div>
            <span>{t.offerPrice}</span>
            <strong>{money(offer.priceCents)}</strong>
          </div>
          {offer.discountCents != null && (
            <div>
              <span>
                {t.customerDiscount} ·{" "}
                {new Intl.NumberFormat(locale, {
                  maximumFractionDigits: 2,
                }).format(offer.discountPercent)}
                %
              </span>
              <strong>−{money(offer.discountCents)}</strong>
            </div>
          )}
          <div className="customer-offer-total">
            <span>{offer.partial ? t.offerSubtotal : t.offerFinal}</span>
            <strong>{money(offer.finalCents)}</strong>
          </div>
          {offer.partial && <p>{t.offerPartial}</p>}
          <p>
            {pricing.tax === "excluded"
              ? t.taxExcluded
              : pricing.tax === "included"
                ? t.taxIncluded
                : t.taxUnconfirmed}
          </p>
        </div>
      )}
      {(!offer || error) && (
        <p className="customer-offer-error" role="alert">
          {error || t.offerAdjustmentError}
        </p>
      )}
      <button
        className="customer-offer-download"
        type="button"
        disabled={busy || disabled || !offer || !brand.name.trim()}
        onClick={download}
      >
        <CIcon name="document" />
        {busy ? t.generating : t.downloadCustomerOffer}
      </button>
    </section>
  );
}
