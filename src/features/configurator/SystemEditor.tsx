"use client";
import { memo, useState } from "react";
import colours from "./colours.json";
import {
  isMotorized,
  isPergola,
  isRoof,
  membraneColours,
  modelFor,
  mountsFor,
  slatTable,
  slidingGlassOptions,
  textileColours,
} from "./catalog";
import { CIcon, Dialog, Field } from "./ui";
import type { Copy } from "./locales";
import type { ConfigLocale, SystemConfiguration } from "./types";
import { glassLabel } from "./summary";
import { formatPrice } from "./pricing";
import type { OrderPricing, SystemPrice } from "./pricing-types";
import {
  BIO_BEAM_HEIGHT,
  frontPostPlan,
  intermediatePostCount,
} from "./layout";

function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 30000,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <div className="ac-number-field">
      <Field label={label + " · mm"} hint={hint}>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-invalid={value < min || value > max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </Field>
      <input
        type="range"
        aria-label={label}
        min={Math.max(min, 500)}
        max={max}
        step={step}
        value={Math.max(Math.max(min, 500), Math.min(max, value))}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
function ColourPicker({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  t: Copy;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [collection, setCollection] = useState("all");
  const colour = colours.find((c) => c.id === value)!;
  const filtered = colours.filter(
    (c) =>
      (collection === "all" || c.collection === collection) &&
      `${c.id} ${c.name} ${c.collection}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="ac-colour-field">
      <span>{label}</span>
      <button
        type="button"
        className="ac-colour-selected"
        onClick={() => setOpen(true)}
      >
        <i style={{ background: colour.hex }} />
        <span>
          <strong>{colour.id}</strong>
          <small>
            {colour.collection}
            {colour.name !== colour.id ? " · " + colour.name : ""}
          </small>
        </span>
        <CIcon name="palette" />
      </button>
      {open && (
        <Dialog
          title={label}
          closeLabel={t.close}
          onClose={() => setOpen(false)}
        >
          <div className="ac-colour-search">
            <input
              autoFocus
              aria-label={t.searchColour}
              placeholder={t.searchColour}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label={t.searchColour}
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              {["all", "RAL Classic", "Sahara", "Riviera", "Cosmos"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c === "all" ? t.all : c}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="ac-colour-grid">
            {filtered.map((c) => (
              <button
                type="button"
                key={c.id}
                aria-pressed={value === c.id}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
              >
                <i style={{ background: c.hex }} />
                <strong>{c.id}</strong>
                <small>{c.name !== c.id ? c.name : c.collection}</small>
              </button>
            ))}
            {!filtered.length && <p>{t.noResults}</p>}
          </div>
          <p className="ac-hint">{t.colourHint}</p>
        </Dialog>
      )}
    </div>
  );
}
function SystemEditorView({
  system: s,
  onChange,
  t,
  locale = "en",
  price,
  pricing,
}: {
  system: SystemConfiguration;
  onChange: (p: Partial<SystemConfiguration>) => void;
  t: Copy;
  locale?: ConfigLocale;
  price?: SystemPrice;
  pricing?: OrderPricing;
}) {
  const [tab, setTab] = useState<"dimensions" | "finishes" | "equipment">(
    "dimensions",
  );
  const m = modelFor(s.model),
    bio = m.kind === "bioclimatic",
    retract = m.kind === "retractable",
    glass = ["runglass", "thermoglass", "tripleglass", "wintergarden"].includes(
      s.model,
    ),
    sliding = ["runglass", "thermoglass"].includes(s.model);
  const table = slatTable(s.model);
  const postPlan = frontPostPlan(s);
  const toggle = (key: "remote" | "lighting" | "sheetRoof", label = t[key]) => (
    <label className="ac-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={!!s[key]}
        onChange={(e) => onChange({ [key]: e.target.checked })}
      />
    </label>
  );
  return (
    <aside className="ac-editor">
      <div className="ac-editor-heading">
        <span className="ac-eyebrow">{t.system}</span>
        <h2>{m.name}</h2>
        <p>{t[m.kind]}</p>
        {price && pricing && (
          <div className="ac-editor-price">
            <span>
              {price.status === "partial"
                ? t.pricePartial
                : pricing.discountPercent > 0
                  ? t.afterDiscount
                  : t.listPrice}
            </span>
            <strong>
              {price.netCents == null
                ? t.priceOnRequest
                : formatPrice(price.netCents, locale, pricing.currency)}
            </strong>
          </div>
        )}
      </div>
      <div className="ac-tabs" role="tablist" aria-label={t.configure}>
        {(["dimensions", "finishes", "equipment"] as const).map((key, i) => (
          <button
            type="button"
            role="tab"
            id={"ac-tab-" + key}
            aria-controls="ac-settings"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            key={key}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const tabs = ["dimensions", "finishes", "equipment"] as const;
                const next = tabs[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3];
                setTab(next);
                document.getElementById("ac-tab-" + next)?.focus();
              }
            }}
            onClick={() => setTab(key)}
          >
            <CIcon
              name={
                key === "dimensions"
                  ? "ruler"
                  : key === "finishes"
                    ? "palette"
                    : "settings"
              }
            />
            {t[key]}
          </button>
        ))}
      </div>
      <div
        className="ac-editor-content"
        role="tabpanel"
        id="ac-settings"
        aria-labelledby={"ac-tab-" + tab}
      >
        {tab === "dimensions" && (
          <>
            <Field label={t.label}>
              <input
                value={s.label}
                maxLength={120}
                onChange={(e) => onChange({ label: e.target.value })}
              />
            </Field>
            <NumberField
              label={t.width}
              value={s.width}
              max={m.width ?? 30000}
              step={50}
              onChange={(width) => onChange({ width })}
              hint={!m.width ? t.unknownLimit : undefined}
            />
            {bio ? (
              <>
                <Field label={t.slats} hint={t.slatHint}>
                  <select
                    value={s.slats}
                    onChange={(e) => {
                      const row = table.find(
                        (r) => r.count === Number(e.target.value),
                      )!;
                      onChange({
                        slats: row.count,
                        projection: row.projection,
                      });
                    }}
                  >
                    {table.map((r) => (
                      <option key={r.count} value={r.count}>
                        {r.count} · {r.projection} mm
                      </option>
                    ))}
                  </select>
                </Field>
                <input
                  type="range"
                  aria-label={t.projection}
                  min={0}
                  max={table.length - 1}
                  value={table.findIndex((r) => r.count === s.slats)}
                  onChange={(e) => {
                    const row = table[Number(e.target.value)];
                    onChange({ slats: row.count, projection: row.projection });
                  }}
                />
                <div className="ac-calculated">
                  <span>{t.projection}</span>
                  <strong>
                    {s.projection} <small>mm</small>
                  </strong>
                </div>
                {s.model === "eira" && (
                  <p className="ac-hint">{t.eiraPending}</p>
                )}
              </>
            ) : (
              isRoof(s.model) && (
                <NumberField
                  label={
                    s.mount === "double" ? t.projectionDouble : t.projection
                  }
                  value={s.projection}
                  max={m.projection ?? 11000}
                  step={50}
                  onChange={(projection) => onChange({ projection })}
                />
              )
            )}
            <NumberField
              label={t.height}
              value={s.height}
              min={bio ? BIO_BEAM_HEIGHT + 1 : 1}
              max={m.height ?? 10000}
              step={50}
              onChange={(height) => onChange({ height })}
              hint={isPergola(s.model) ? t.heightLimit : undefined}
            />
            {isPergola(s.model) && (
              <>
                <NumberField
                  label={t.postHeight}
                  value={s.postHeight}
                  max={Math.max(
                    1,
                    bio ? 3000 - BIO_BEAM_HEIGHT : s.height - 100,
                  )}
                  step={50}
                  onChange={(postHeight) => onChange({ postHeight })}
                  hint={bio ? t.bioHeightHint : undefined}
                />
                <Field label={t.mount}>
                  <select
                    value={s.mount}
                    onChange={(e) =>
                      onChange({
                        mount: e.target.value as SystemConfiguration["mount"],
                      })
                    }
                  >
                    {mountsFor(s.model).map((m) => (
                      <option key={m} value={m}>
                        {t[m]}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            {s.mount === "double" && <p className="ac-hint">{t.doubleHint}</p>}
            {(retract || s.model === "wintergarden") && (
              <p className="ac-hint">{t.slopeHint}</p>
            )}
            <Field label={t.quantity}>
              <input
                type="number"
                min={1}
                max={99}
                step={1}
                value={s.quantity}
                onChange={(e) => onChange({ quantity: Number(e.target.value) })}
              />
            </Field>
          </>
        )}
        {tab === "finishes" && (
          <>
            <ColourPicker
              label={t.frameColour}
              value={s.frameColour}
              onChange={(frameColour) => onChange({ frameColour })}
              t={t}
            />
            {bio && (
              <ColourPicker
                label={t.roofColour}
                value={s.roofColour}
                onChange={(roofColour) => onChange({ roofColour })}
                t={t}
              />
            )}
            {retract && (
              <fieldset className="ac-swatches">
                <legend>{t.membrane}</legend>
                {membraneColours.map((c) => (
                  <button
                    type="button"
                    aria-pressed={s.membrane === c.id}
                    key={c.id}
                    onClick={() => onChange({ membrane: c.id })}
                  >
                    <i style={{ background: c.hex }} />
                    <span>
                      <strong>{c.id}</strong>
                      <small>{t[c.label]}</small>
                    </span>
                    {s.membrane === c.id && <CIcon name="check" />}
                  </button>
                ))}
              </fieldset>
            )}
            {(s.model === "screenzip" || s.model === "skyzip") && (
              <fieldset className="ac-swatches">
                <legend>{t.textile}</legend>
                {(
                  Object.entries(textileColours) as [
                    SystemConfiguration["textile"],
                    string,
                  ][]
                ).map(([key, hex]) => (
                  <button
                    type="button"
                    aria-pressed={s.textile === key}
                    key={key}
                    onClick={() => onChange({ textile: key })}
                  >
                    <i style={{ background: hex }} />
                    <span>{t[key]}</span>
                    {s.textile === key && <CIcon name="check" />}
                  </button>
                ))}
              </fieldset>
            )}
            {glass && (
              <Field label={t.glass}>
                <select
                  value={s.glass}
                  onChange={(e) =>
                    onChange({
                      glass: e.target.value as SystemConfiguration["glass"],
                    })
                  }
                >
                  {(sliding
                    ? slidingGlassOptions
                    : s.model === "tripleglass"
                      ? (["clear", "lowe", "brown", "grey", "kn66"] as const)
                      : ([
                          "clear",
                          "lowe",
                          "brown",
                          "grey",
                          "stopsoll",
                        ] as const)
                  ).map((g) => (
                    <option key={g} value={g}>
                      {glassLabel(s.model, g, locale)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {s.model === "wintergarden" && (
              <Field label={t.laminate}>
                <select
                  value={s.laminate}
                  onChange={(e) =>
                    onChange({
                      laminate: e.target
                        .value as SystemConfiguration["laminate"],
                    })
                  }
                >
                  {["4.4.2", "5.5.2", "6.6.2"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </Field>
            )}
            <p className="ac-hint">{t.colourHint}</p>
          </>
        )}
        {tab === "equipment" && (
          <>
            {isMotorized(s.model) && (
              <>
                <Field label={t.motor}>
                  <select
                    value={s.motor}
                    onChange={(e) =>
                      onChange({
                        motor: e.target.value as SystemConfiguration["motor"],
                      })
                    }
                  >
                    <option>PergolaLink</option>
                    <option>DemoDrive</option>
                  </select>
                </Field>
                {s.model === "tripleglass" ? (
                  <div className="ac-calculated">
                    <span>{t.motorSide}</span>
                    <strong>{t.interior}</strong>
                  </div>
                ) : (
                  <Field label={t.motorSide} hint={t.exterior}>
                    <select
                      value={s.motorSide}
                      onChange={(e) =>
                        onChange({
                          motorSide: e.target
                            .value as SystemConfiguration["motorSide"],
                        })
                      }
                    >
                      <option value="left">{t.left}</option>
                      <option value="right">{t.right}</option>
                    </select>
                  </Field>
                )}
                {toggle("remote")}
                {s.remote && (
                  <Field label={t.channels}>
                    <select
                      value={s.channels}
                      onChange={(e) =>
                        onChange({
                          channels: Number(
                            e.target.value,
                          ) as SystemConfiguration["channels"],
                        })
                      }
                    >
                      {[1, 2, 5, 15].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </>
            )}
            {isPergola(s.model) && (
              <>
                <Field
                  label={t.intermediatePosts}
                  hint={`0–${postPlan.maxExtra} · ${t.postSpacing}`}
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={postPlan.maxExtra}
                    step={1}
                    value={intermediatePostCount(s)}
                    onChange={(e) =>
                      onChange({ intermediatePosts: Number(e.target.value) })
                    }
                  />
                </Field>
                <div className="ac-calculated">
                  <span>{t.includedPosts}</span>
                  <strong>{postPlan.included.length}</strong>
                </div>
                <div className="ac-calculated">
                  <span>{t.totalFrontPosts}</span>
                  <strong>
                    {postPlan.positions.length} / {postPlan.maxTotal}
                  </strong>
                </div>
                <p className="ac-hint">{t.intermediatePostHint}</p>
              </>
            )}
            {(bio || retract || s.model === "wintergarden") && (
              <>
                {toggle(
                  "lighting",
                  s.model === "wintergarden" ? t.ledSpots : t.lighting,
                )}
                {s.model === "wintergarden" && s.lighting && (
                  <p className="ac-hint">{t.ledSpotsHint}</p>
                )}
                {s.lighting && (
                  <Field label={t.lightTone}>
                    <select
                      value={s.lightTone}
                      onChange={(e) =>
                        onChange({
                          lightTone: e.target
                            .value as SystemConfiguration["lightTone"],
                        })
                      }
                    >
                      <option value="warm">{t.warm}</option>
                      <option value="cool">{t.cool}</option>
                    </select>
                  </Field>
                )}
              </>
            )}
            {retract && toggle("sheetRoof")}
            {(sliding || s.model === "tripleglass") && (
              <Field label={t.panels}>
                <select
                  value={s.panels}
                  onChange={(e) => onChange({ panels: Number(e.target.value) })}
                >
                  {(s.model === "tripleglass"
                    ? [2, 3]
                    : Array.from(
                        {
                          length:
                            (s.model === "thermoglass" || s.opening === "center"
                              ? s.tracks * 2
                              : s.tracks) - 1,
                        },
                        (_, i) => i + 2,
                      )
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {sliding && (
              <>
                <Field label={t.tracks}>
                  <select
                    value={s.tracks}
                    onChange={(e) =>
                      onChange({ tracks: Number(e.target.value) as 3 | 4 })
                    }
                  >
                    {(s.model === "runglass" ? [3, 4] : [4]).map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t.opening} hint={t.exterior}>
                  <select
                    value={s.opening}
                    onChange={(e) =>
                      onChange({
                        opening: e.target
                          .value as SystemConfiguration["opening"],
                      })
                    }
                  >
                    {(["left", "right", "center"] as const).map((v) => (
                      <option
                        key={v}
                        value={v}
                        disabled={
                          s.model === "thermoglass" &&
                          s.panels > 4 &&
                          v !== "center"
                        }
                      >
                        {t[v]}
                      </option>
                    ))}
                  </select>
                </Field>
                {s.model === "thermoglass" && (
                  <p className="ac-hint">{t.thermoHint}</p>
                )}
              </>
            )}
            {s.model === "wintergarden" && (
              <p className="ac-hint">{t.staticRoof}</p>
            )}
            <Field label={t.notes}>
              <textarea
                rows={4}
                maxLength={4000}
                value={s.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
              />
            </Field>
          </>
        )}
      </div>
    </aside>
  );
}
export const SystemEditor = memo(SystemEditorView);
