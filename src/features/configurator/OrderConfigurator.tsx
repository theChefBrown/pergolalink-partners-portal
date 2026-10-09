"use client";
/* eslint-disable @next/next/no-img-element -- Portable preview images are generated locally, without a Next image server. */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  attachmentBytes,
  configurationErrors,
  createSystem,
  isRoof,
  MAX_ATTACHMENT_BYTES,
  modelFor,
  models,
  patchSystem,
} from "./catalog";
import counties from "./counties.json";
import countryNames from "./countries.json";
import { withBasePath } from "../../lib/base-path";
import { getCopy } from "./locales";
import { CIcon, Dialog, Field, SystemSketch } from "./ui";
import { Attachments } from "./Attachments";
import { SystemEditor } from "./SystemEditor";
import { TechnicalDrawing } from "./TechnicalDrawing";
import { PricePanel } from "./PricePanel";
import { CustomerOfferPanel } from "./CustomerOfferPanel";
import { defaultCustomerOffer } from "./customer-offer";
import { priceOrder } from "./pricing";
import type { OrderPricing, PricePolicy } from "./pricing-types";
import { errorLabel, systemRows } from "./summary";
import type {
  ClientDetails,
  CompletedConfiguration,
  ConfigLocale,
  ConfiguratorDraft,
  Locality,
  ModelId,
  SystemConfiguration,
} from "./types";
import "./styles.css";

const Scene3D = lazy(() => import("./Scene3D"));
const countryCodes = Object.keys(countryNames.ro);
const blankClient = (): ClientDetails => ({
  name: "",
  reference: "",
  address: "",
  country: "RO",
  county: "",
  localityId: "",
  city: "",
  date: new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()),
  notes: "",
});
export type OrderConfiguratorProps = {
  locale?: ConfigLocale;
  assetBase?: string;
  reference?: string;
  initialDraft?: ConfiguratorDraft;
  availableModels?: ModelId[];
  headerTools?: ReactNode;
  notice?: ReactNode;
  dealer?: OrderPricing["dealer"];
  discountPercent?: number;
  pricingPolicy?: PricePolicy;
  onExit: () => void;
  onComplete: (result: CompletedConfiguration) => void | Promise<void>;
  onDraftChange?: (draft: ConfiguratorDraft) => void;
};
export function OrderConfigurator({
  locale = "en",
  assetBase = withBasePath("/configurator"),
  reference = "",
  initialDraft,
  availableModels,
  headerTools,
  notice,
  dealer,
  discountPercent = 0,
  pricingPolicy,
  onExit,
  onComplete,
  onDraftChange,
}: OrderConfiguratorProps) {
  const t = useMemo(() => getCopy(locale), [locale]);
  const [step, setStep] = useState(0),
    [client, setClient] = useState<ClientDetails>(
      initialDraft?.client ?? blankClient,
    ),
    [systems, setSystems] = useState<SystemConfiguration[]>(
      () => initialDraft?.systems.map((s) => patchSystem(s, {})) ?? [],
    ),
    [files, setFiles] = useState<File[]>([]),
    [activeId, setActiveId] = useState(initialDraft?.systems[0]?.id ?? "");
  const [dialog, setDialog] = useState<
      "exit" | "guide" | "add" | "remove" | null
    >(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(Boolean(initialDraft)),
    [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [showDimensions, setShowDimensions] = useState(true),
    [resetToken, setResetToken] = useState(0),
    [viewer, setViewer] = useState<"3d" | "drawing">("3d");
  const [locations, setLocations] = useState<Locality[]>([]),
    [locationStatus, setLocationStatus] = useState<
      "idle" | "loading" | "ready" | "error"
    >("idle"),
    [locationAttempt, setLocationAttempt] = useState(0);
  const current = systems.find((s) => s.id === activeId) ?? systems[0],
    county = counties.find((c) => c.name === client.county);
  const allowed = models.filter(
    (m) => !availableModels || availableModels.includes(m.id),
  );
  const draft = useMemo<ConfiguratorDraft>(
    () => ({ version: 1, client, systems }),
    [client, systems],
  );
  const pricing = useMemo(
    () => priceOrder(systems, discountPercent, dealer, pricingPolicy),
    [systems, discountPercent, dealer, pricingPolicy],
  );
  const cache = useRef<{ key: string; result: CompletedConfiguration } | null>(
    null,
  );
  const heading = useRef<HTMLHeadingElement>(null),
    leaving = useRef(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [customerOffer, setCustomerOffer] = useState(defaultCustomerOffer);
  const [customerLogo, setCustomerLogo] = useState<string>();
  const [previewImages, setPreviewImages] = useState<Record<string, string>>(
    {},
  );
  const snapshotCache = useRef<{
    key: string;
    promise: Promise<Record<string, string>>;
  } | null>(null);
  const captureSystems = useCallback(() => {
    const key = JSON.stringify(systems);
    if (snapshotCache.current?.key === key)
      return snapshotCache.current.promise;
    const promise = import("./Scene3D").then((module) =>
      module.renderSnapshots(systems),
    );
    snapshotCache.current = { key, promise };
    promise.catch(() => {
      if (snapshotCache.current?.promise === promise)
        snapshotCache.current = null;
    });
    return promise;
  }, [systems]);
  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    captureSystems()
      .then((images) => {
        if (!cancelled) setPreviewImages(images);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [step, captureSystems]);
  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => {
      if (dirty && !leaving.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  useEffect(() => {
    if (client.country !== "RO" || !county) return;
    const controller = new AbortController();
    fetch(`${assetBase}/localities/${county.id}.json`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error("locations");
        return r.json() as Promise<Locality[]>;
      })
      .then((values) => {
        if (!controller.signal.aborted) {
          setLocations(values);
          setLocationStatus("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLocationStatus("error");
      });
    return () => controller.abort();
  }, [client.country, county, assetBase, locationAttempt]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      last = 0;
    const start = performance.now(),
      phase = Math.acos(1 - 2 * progress);
    const tick = (now: number) => {
      if (now - last > 32) {
        setProgress((1 - Math.cos(phase + (now - start) / 1500)) / 2);
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // The current progress is sampled once when the user starts the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  const updateClient = (patch: Partial<ClientDetails>) => {
    setClient((c) => ({ ...c, ...patch }));
    setDirty(true);
    setError("");
  };
  const updateSystem = useCallback(
    (patch: Partial<SystemConfiguration>) => {
      setSystems((items) =>
        items.map((s) => (s.id === activeId ? patchSystem(s, patch) : s)),
      );
      setDirty(true);
      setError("");
    },
    [activeId],
  );
  const move = (next: number) => {
    setStep(next);
    setError("");
    setPlaying(false);
    requestAnimationFrame(() => {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  };
  function validClient() {
    return Boolean(
      client.name.trim() &&
        client.address.trim() &&
        client.country &&
        client.city.trim() &&
        client.date &&
        /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(client.date) &&
        (client.country !== "RO" ||
          (county &&
            locationStatus === "ready" &&
            locations.some(
              (p) => p.id === client.localityId && p.name === client.city,
            ))),
    );
  }
  function validSystems() {
    const invalid = systems.find(
      (s) =>
        configurationErrors(s).length || !allowed.some((m) => m.id === s.model),
    );
    if (!systems.length) {
      setDialog("add");
      return false;
    }
    if (invalid) {
      setActiveId(invalid.id);
      setError(
        t.invalidConfiguration +
          " " +
          configurationErrors(invalid)
            .map((key) => errorLabel(key, locale))
            .join(", "),
      );
      return false;
    }
    return true;
  }
  function addModel(model: ModelId) {
    const system = createSystem(model);
    setSystems((old) => [...old, system]);
    setActiveId(system.id);
    setProgress(0);
    setPlaying(false);
    setDirty(true);
    setDialog(null);
    move(1);
  }
  function selectSystem(id: string) {
    setActiveId(id);
    setPlaying(false);
    setProgress(0);
    setError("");
  }
  async function prepare(): Promise<CompletedConfiguration> {
    const key = JSON.stringify([
      draft,
      locale,
      reference,
      pricing,
      files.map((f) => [f.name, f.size, f.lastModified]),
    ]);
    if (cache.current?.key === key && cache.current.result.files === files)
      return cache.current.result;
    const [images, { generateReport }] = await Promise.all([
      captureSystems(),
      import("./report"),
    ]);
    const report = await generateReport(
      draft,
      files,
      images,
      locale,
      assetBase,
      reference,
      pricing,
    );
    const result = { draft, files, images, report, pricing };
    cache.current = { key, result };
    return result;
  }
  async function finish(downloadOnly = false) {
    if (busy) return;
    if (!validClient()) {
      move(0);
      setError(t.clientError);
      return;
    }
    if (!validSystems()) {
      setStep(1);
      return;
    }
    if (attachmentBytes(files) > MAX_ATTACHMENT_BYTES) {
      setError(t.fileError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await prepare();
      if (downloadOnly) {
        const url = URL.createObjectURL(result.report),
          link = document.createElement("a");
        link.href = url;
        link.download = result.report.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        leaving.current = true;
        try {
          await onComplete({ ...result, customerOffer, customerLogo });
        } catch (cause) {
          leaving.current = false;
          throw cause;
        }
      }
    } catch {
      setError(t.reportError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ac-root" aria-busy={busy}>
      <header className="ac-header">
        <div className="ac-brand">
          <span className="ac-logo" role="img" aria-label="PergolaLink">
            <img
              className="ac-logo-light"
              src={`${assetBase}/pergolalink-logo-light.svg`}
              alt=""
              width={1600}
              height={408}
            />
            <img
              className="ac-logo-dark"
              src={`${assetBase}/pergolalink-logo-dark.svg`}
              alt=""
              width={1600}
              height={408}
            />
          </span>
          <span className="ac-brand-caption">{t.title}</span>
        </div>
        <div className="ac-header-actions">
          {headerTools}
          <button
            type="button"
            className="ac-button ac-subtle"
            aria-label={t.guide}
            onClick={() => setDialog("guide")}
          >
            <CIcon name="help" />
            <span>{t.guide}</span>
          </button>
          <button
            type="button"
            className="ac-button ac-subtle"
            aria-label={t.exit}
            disabled={busy}
            onClick={() => setDialog("exit")}
          >
            <CIcon name="exit" />
            <span>{t.exit}</span>
          </button>
        </div>
      </header>
      <div className="ac-stepbar">
        <ol>
          {[t.client, t.configure, t.review].map((name, i) => (
            <li
              key={i}
              className={step === i ? "active" : step > i ? "complete" : ""}
            >
              <button
                type="button"
                disabled={i > step || busy}
                aria-current={step === i ? "step" : undefined}
                onClick={() => move(i)}
              >
                <span>
                  {step > i ? (
                    <CIcon name="check" />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {name}
              </button>
            </li>
          ))}
        </ol>
        <span className="ac-stepbar-note">
          <i />
          {t.newOrder}
        </span>
      </div>
      <div className="ac-content">
        {step === 0 ? (
          <>
            <div className="ac-intro">
              <div>
                <span className="ac-eyebrow">PERGOLALINK · OUTDOOR LIVING</span>
                <h1 ref={heading} tabIndex={-1}>
                  {t.intro}
                </h1>
                <p>{t.introText}</p>
              </div>
              <SystemSketch large />
            </div>
            <form
              className="ac-client-layout"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!validClient()) {
                  setError(t.clientError);
                  return;
                }
                move(1);
                if (!systems.length) setDialog("add");
              }}
            >
              <section className="ac-card">
                <div className="ac-section-heading">
                  <h2>
                    <CIcon name="pin" />
                    {t.client}
                  </h2>
                  <span>01</span>
                </div>
                <div className="ac-form-grid">
                  <Field label={t.name + " *"}>
                    <input
                      name="client-name"
                      autoComplete="name"
                      required
                      maxLength={150}
                      value={client.name}
                      onChange={(e) => updateClient({ name: e.target.value })}
                    />
                  </Field>
                  <Field label={t.reference}>
                    <input
                      name="client-reference"
                      maxLength={100}
                      value={client.reference}
                      onChange={(e) =>
                        updateClient({ reference: e.target.value })
                      }
                    />
                  </Field>
                  <Field label={t.country + " *"}>
                    <select
                      name="client-country"
                      value={client.country}
                      onChange={(e) => {
                        updateClient({
                          country: e.target.value,
                          county: "",
                          city: "",
                          localityId: "",
                        });
                        setLocations([]);
                        setLocationStatus("idle");
                      }}
                    >
                      {countryCodes.map((code) => (
                        <option key={code} value={code}>
                          {
                            (countryNames[locale] as Record<string, string>)[
                              code
                            ]
                          }
                        </option>
                      ))}
                    </select>
                  </Field>
                  {client.country === "RO" && (
                    <Field label={t.county + " *"}>
                      <select
                        name="client-county"
                        required
                        value={county?.id ?? ""}
                        onChange={(e) => {
                          updateClient({
                            county:
                              counties.find((c) => c.id === e.target.value)
                                ?.name ?? "",
                            city: "",
                            localityId: "",
                          });
                          setLocations([]);
                          setLocationStatus("loading");
                        }}
                      >
                        <option value="">{t.choose}</option>
                        {counties.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label={t.city + " *"}>
                    {client.country === "RO" ? (
                      <select
                        name="client-locality"
                        required
                        disabled={!county || locationStatus !== "ready"}
                        value={client.localityId}
                        onChange={(e) => {
                          const place = locations.find(
                            (p) => p.id === e.target.value,
                          );
                          updateClient({
                            localityId: place?.id ?? "",
                            city: place?.name ?? "",
                          });
                        }}
                      >
                        <option value="">
                          {locationStatus === "loading" ? t.loading : t.choose}
                        </option>
                        {locations.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.municipality && p.municipality !== p.name
                              ? " · " + p.municipality
                              : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name="client-city"
                        autoComplete="address-level2"
                        required
                        maxLength={150}
                        value={client.city}
                        onChange={(e) => updateClient({ city: e.target.value })}
                      />
                    )}
                  </Field>
                  <div className="ac-wide">
                    <Field label={t.address + " *"}>
                      <input
                        name="client-address"
                        autoComplete="street-address"
                        required
                        maxLength={300}
                        value={client.address}
                        onChange={(e) =>
                          updateClient({ address: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <Field label={t.date}>
                    <input
                      type="date"
                      name="order-date"
                      required
                      value={client.date}
                      onChange={(e) => updateClient({ date: e.target.value })}
                    />
                  </Field>
                  {client.country === "RO" &&
                    county &&
                    locationStatus === "error" && (
                      <div className="ac-wide">
                        {locationStatus === "error" && (
                          <p className="ac-error" role="alert">
                            {t.locationError}{" "}
                            <button
                              type="button"
                              onClick={() => setLocationAttempt((n) => n + 1)}
                            >
                              {t.retry}
                            </button>
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </section>
              <section className="ac-card">
                <div className="ac-section-heading">
                  <h2>
                    <CIcon name="document" />
                    {t.notes}
                  </h2>
                  <span>02</span>
                </div>
                <Field label={t.notes}>
                  <textarea
                    rows={4}
                    name="client-notes"
                    maxLength={4000}
                    value={client.notes}
                    onChange={(e) => updateClient({ notes: e.target.value })}
                  />
                </Field>
                <Attachments
                  onBusyChange={setUploadBusy}
                  files={files}
                  onChange={(values) => {
                    setFiles(values);
                    setDirty(true);
                  }}
                  t={t}
                />
              </section>
              <div className="ac-wide ac-client-actions">
                {error && (
                  <p className="ac-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="ac-button ac-primary"
                  type="submit"
                  disabled={uploadBusy}
                >
                  {t.next}
                  <CIcon name="arrow" />
                </button>
              </div>
            </form>
          </>
        ) : step === 1 ? (
          <>
            <div className="ac-workspace-heading">
              <div>
                <span className="ac-eyebrow">{client.name}</span>
                <h1 ref={heading} tabIndex={-1}>
                  {t.configure}
                </h1>
              </div>
              <button
                type="button"
                className="ac-button ac-primary"
                onClick={() => setDialog("add")}
              >
                <CIcon name="plus" />
                {t.add}
              </button>
            </div>
            <div className="ac-system-strip" aria-label={t.systems}>
              {systems.map((s, i) => (
                <button
                  type="button"
                  aria-pressed={current?.id === s.id}
                  key={s.id}
                  onClick={() => selectSystem(s.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <strong>{s.label || modelFor(s.model).name}</strong>
                  <small>{s.quantity}×</small>
                </button>
              ))}
            </div>
            {current ? (
              <div className="ac-workspace">
                <section className="ac-viewport">
                  <div className="ac-viewport-heading">
                    <div
                      className="ac-viewer-tabs"
                      role="tablist"
                      aria-label={t.configure}
                    >
                      {(["3d", "drawing"] as const).map((mode, index) => (
                        <button
                          key={mode}
                          type="button"
                          role="tab"
                          id={`ac-viewer-${mode}`}
                          aria-selected={viewer === mode}
                          aria-controls="ac-viewer-panel"
                          tabIndex={viewer === mode ? 0 : -1}
                          onClick={() => {
                            setViewer(mode);
                            setPlaying(false);
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "ArrowRight" ||
                              e.key === "ArrowLeft"
                            ) {
                              e.preventDefault();
                              const next = index === 0 ? "drawing" : "3d";
                              setViewer(next);
                              setPlaying(false);
                              document
                                .getElementById(`ac-viewer-${next}`)
                                ?.focus();
                            }
                          }}
                        >
                          <CIcon name={mode === "3d" ? "cube" : "ruler"} />
                          {mode === "3d" ? "3D" : t.technicalDrawing}
                        </button>
                      ))}
                    </div>
                    <div>
                      <button
                        className="ac-icon-button"
                        type="button"
                        aria-label={t.duplicate}
                        onClick={() => {
                          const copy = { ...current, id: crypto.randomUUID() };
                          setSystems((old) => [...old, copy]);
                          selectSystem(copy.id);
                          setDirty(true);
                        }}
                      >
                        <CIcon name="copy" />
                      </button>
                      <button
                        className="ac-icon-button"
                        type="button"
                        disabled={systems.length === 1}
                        aria-label={t.remove}
                        onClick={() => setDialog("remove")}
                      >
                        <CIcon name="trash" />
                      </button>
                    </div>
                  </div>
                  <div
                    id="ac-viewer-panel"
                    role="tabpanel"
                    aria-labelledby={`ac-viewer-${viewer}`}
                  >
                    {viewer === "drawing" ? (
                      <TechnicalDrawing system={current} locale={locale} />
                    ) : (
                      <>
                        <Suspense
                          fallback={
                            <div className="ac-scene-loading">
                              <CIcon name="cube" />
                              {t.loading}
                            </div>
                          }
                        >
                          <Scene3D
                            configuration={current}
                            locale={locale}
                            progress={progress}
                            showDimensions={showDimensions}
                            resetToken={resetToken}
                          />
                        </Suspense>
                        <div className="ac-viewport-caption">
                          <span>{t.orbit}</span>
                          <span>
                            {current.width} ×{" "}
                            {isRoof(current.model)
                              ? `${current.projection} × `
                              : ""}
                            {current.height} mm
                          </span>
                        </div>
                        <div className="ac-view-controls">
                          <button
                            type="button"
                            className="ac-icon-button"
                            aria-label={t.resetView}
                            onClick={() => setResetToken((n) => n + 1)}
                          >
                            <CIcon name="reset" />
                          </button>
                          <button
                            type="button"
                            className="ac-icon-button"
                            aria-label={t.showDimensions}
                            aria-pressed={showDimensions}
                            onClick={() => setShowDimensions((v) => !v)}
                          >
                            <CIcon name="ruler" />
                          </button>
                          {current.model !== "wintergarden" && (
                            <>
                              <button
                                type="button"
                                className="ac-play-button"
                                aria-label={playing ? t.pause : t.play}
                                onClick={() => setPlaying((v) => !v)}
                              >
                                <CIcon name={playing ? "pause" : "play"} />
                                <span>{playing ? t.pause : t.play}</span>
                              </button>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={Math.round(progress * 100)}
                                aria-label={t.openness}
                                onChange={(e) => {
                                  setPlaying(false);
                                  setProgress(Number(e.target.value) / 100);
                                }}
                              />
                              <output>{Math.round(progress * 100)}%</output>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </section>
                <SystemEditor
                  locale={locale}
                  key={current.id}
                  system={current}
                  onChange={updateSystem}
                  t={t}
                  price={pricing.systems.find((p) => p.systemId === current.id)}
                  pricing={pricing}
                />
              </div>
            ) : (
              <button
                type="button"
                className="ac-empty"
                onClick={() => setDialog("add")}
              >
                <CIcon name="plus" />
                {t.add}
              </button>
            )}
            {current && (
              <PricePanel
                pricing={pricing}
                system={pricing.systems.find((p) => p.systemId === current.id)}
                locale={locale}
              />
            )}
            {error && (
              <p className="ac-error" role="alert">
                {error}
              </p>
            )}
            <div className="ac-bottom-actions">
              <button
                type="button"
                className="ac-button"
                onClick={() => move(0)}
              >
                <CIcon name="back" />
                {t.back}
              </button>
              <span>
                {systems.length} {t.systems.toLowerCase()}
              </span>
              <button
                type="button"
                className="ac-button ac-primary"
                onClick={() => {
                  if (validSystems()) move(2);
                }}
              >
                {t.review}
                <CIcon name="arrow" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="ac-review-heading">
              <span className="ac-eyebrow">{t.review}</span>
              <h1 ref={heading} tabIndex={-1}>
                {t.orderSummary}
              </h1>
              <p>{t.reviewText}</p>
            </div>
            <div className="ac-review-layout">
              <div className="ac-review-systems">
                {systems.map((s, i) => (
                  <section className="ac-card ac-review-system" key={s.id}>
                    <div className="ac-section-heading">
                      <h2>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        {s.label || modelFor(s.model).name}
                      </h2>
                      <button
                        type="button"
                        className="ac-button ac-subtle"
                        disabled={busy}
                        onClick={() => {
                          selectSystem(s.id);
                          move(1);
                        }}
                      >
                        {t.edit}
                        <CIcon name="arrow" />
                      </button>
                    </div>
                    <div className="ac-review-details">
                      {previewImages[s.id] ? (
                        <img
                          className="ac-summary-preview"
                          src={previewImages[s.id]}
                          alt={modelFor(s.model).name}
                        />
                      ) : (
                        <SystemSketch kind={modelFor(s.model).kind} />
                      )}
                      <dl>
                        {systemRows(s, locale).map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {s.notes && <p className="ac-user-note">{s.notes}</p>}
                    <PricePanel
                      pricing={pricing}
                      system={pricing.systems.find((p) => p.systemId === s.id)}
                      locale={locale}
                      compact
                    />
                  </section>
                ))}
              </div>
              <aside className="ac-card ac-review-client">
                <CIcon name="pin" />
                <h2>{client.name}</h2>
                <p>
                  {client.address}
                  <br />
                  {[client.city, client.county].filter(Boolean).join(", ")}
                  <br />
                  {
                    (countryNames[locale] as Record<string, string>)[
                      client.country
                    ]
                  }
                </p>
                <p>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "long",
                  }).format(new Date(client.date + "T12:00:00"))}
                </p>
                {client.notes && <p className="ac-user-note">{client.notes}</p>}
                <div className="ac-calculated">
                  <span>{t.photos}</span>
                  <strong>{files.length}</strong>
                </div>
                <p className="ac-hint">{t.reportHint}</p>
                <PricePanel pricing={pricing} locale={locale} compact />
                <button
                  type="button"
                  className="ac-button ac-primary"
                  disabled={busy}
                  onClick={() => finish(true)}
                >
                  <CIcon name="document" />
                  {busy ? t.generating : t.download}
                </button>
                <CustomerOfferPanel
                  pricing={pricing}
                  draft={draft}
                  brand={{
                    name: dealer?.name ?? "",
                    logoDataUrl: customerLogo,
                  }}
                  initialSettings={customerOffer}
                  getImages={captureSystems}
                  locale={locale}
                  reference={reference}
                  assetBase={assetBase}
                  disabled={busy}
                  onBusyChange={setBusy}
                  onSettingsChange={setCustomerOffer}
                  onLogoChange={setCustomerLogo}
                />
              </aside>
            </div>
            {error && (
              <p className="ac-error" role="alert">
                {error}
              </p>
            )}
            <div className="ac-bottom-actions">
              <button
                type="button"
                className="ac-button"
                disabled={busy}
                onClick={() => move(1)}
              >
                <CIcon name="back" />
                {t.back}
              </button>
              <button
                type="button"
                className="ac-button ac-primary"
                disabled={busy}
                onClick={() => finish()}
              >
                {busy ? t.generating : t.finish}
                <CIcon name="check" />
              </button>
            </div>
          </>
        )}
        {notice && <div className="ac-demo-note">{notice}</div>}
      </div>
      {dialog === "add" && (
        <Dialog
          title={t.chooseSystem}
          closeLabel={t.close}
          onClose={() => setDialog(null)}
        >
          <div className="ac-model-grid">
            {allowed.map((m) => (
              <button key={m.id} type="button" onClick={() => addModel(m.id)}>
                <SystemSketch kind={m.kind} />
                <strong>{m.name}</strong>
                <small>{t[m.kind]}</small>
                <span>
                  <CIcon name="plus" />
                </span>
              </button>
            ))}
          </div>
          {!allowed.length && <p>{t.noResults}</p>}
        </Dialog>
      )}
      {dialog === "guide" && (
        <Dialog
          title={t.guide}
          closeLabel={t.close}
          onClose={() => setDialog(null)}
        >
          <ol className="ac-guide">
            {[
              [t.client, t.guideClient, "pin"],
              [t.configure, t.guideConfigure, "cube"],
              [t.systems, t.guideBulk, "layers"],
            ].map(([title, body, icon], i) => (
              <li key={i}>
                <span>
                  <CIcon name={icon as "pin" | "cube" | "layers"} />
                </span>
                <div>
                  <small>0{i + 1}</small>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="ac-hint">{t.fileHint}</p>
        </Dialog>
      )}
      {dialog === "exit" && (
        <Dialog
          title={t.exitTitle}
          closeLabel={t.close}
          onClose={() => setDialog(null)}
        >
          <p>{t.exitText}</p>
          <div className="ac-dialog-actions">
            <button
              className="ac-button ac-primary"
              type="button"
              autoFocus
              onClick={() => setDialog(null)}
            >
              {t.stay}
            </button>
            <button
              className="ac-button"
              type="button"
              onClick={() => {
                leaving.current = true;
                onExit();
              }}
            >
              {t.exit}
            </button>
          </div>
        </Dialog>
      )}
      {dialog === "remove" && (
        <Dialog
          title={t.removeTitle}
          closeLabel={t.close}
          onClose={() => setDialog(null)}
        >
          <p>{current?.label || (current && modelFor(current.model).name)}</p>
          <div className="ac-dialog-actions">
            <button
              className="ac-button"
              type="button"
              onClick={() => setDialog(null)}
            >
              {t.close}
            </button>
            <button
              className="ac-button ac-primary"
              type="button"
              onClick={() => {
                const remaining = systems.filter((s) => s.id !== current.id);
                setSystems(remaining);
                selectSystem(remaining[0].id);
                setDialog(null);
                setDirty(true);
              }}
            >
              {t.remove}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
