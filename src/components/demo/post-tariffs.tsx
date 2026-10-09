"use client";
import { useState } from "react";
import { models, isPergola } from "@/features/configurator/catalog";
import { pricePolicy } from "@/features/configurator/price-policy";
import { getCopy } from "@/features/configurator/locales";
import type { ModelId } from "@/features/configurator/types";
import { useDemo } from "./demo-provider";
import { Panel, Field, FormError, validForm } from "./ui";

export function PostTariffs() {
  const { data, locale, w, commit } = useDemo();
  const policy = data.pricingPolicy ?? pricePolicy;
  const t = getCopy(locale);
  const applicable = models.filter((m) => isPergola(m.id));
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      applicable.map((m) => [
        m.id,
        policy.extraPostCents[m.id] == null
          ? ""
          : String(policy.extraPostCents[m.id]! / 100),
      ]),
    ),
  );
  const [error, setError] = useState(false);
  return (
    <Panel title={t.postTariffs}>
      <p className="muted">{t.postTariffsHint}</p>
      <form
        noValidate
        onSubmit={(event) => {
          const valid =
            validForm(event) &&
            Object.values(values).every(
              (v) =>
                v === "" ||
                (Number.isFinite(Number(v)) &&
                  Number(v) >= 0 &&
                  Number(v) <= 100000),
            );
          if (!valid) {
            setError(true);
            return;
          }
          const extraPostCents: Partial<Record<ModelId, number | null>> =
            Object.fromEntries(
              applicable.map((m) => [
                m.id,
                values[m.id] === ""
                  ? null
                  : Math.round(Number(values[m.id]) * 100),
              ]),
            );
          commit(
            "recordUpdated",
            (state) => ({
              ...state,
              pricingPolicy: {
                ...(state.pricingPolicy ?? pricePolicy),
                version: `${pricePolicy.version}.${Date.now()}`,
                extraPostCents,
              },
            }),
            undefined,
            true,
          );
          setError(false);
        }}
      >
        <div className="form-grid">
          {applicable.map((m) => (
            <Field
              key={m.id}
              label={`${m.name} · ${policy.currency ?? "—"} / ${t.units}`}
            >
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100000}
                step={0.01}
                placeholder={t.pricePending}
                value={values[m.id]}
                onChange={(event) =>
                  setValues((old) => ({ ...old, [m.id]: event.target.value }))
                }
              />
            </Field>
          ))}
        </div>
        <FormError show={error} />
        <div className="form-actions">
          <button type="submit" className="button-primary">
            {w.save}
          </button>
        </div>
      </form>
    </Panel>
  );
}
