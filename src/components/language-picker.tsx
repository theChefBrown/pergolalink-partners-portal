"use client";

import { useEffect, useRef, useState } from "react";
import { languages } from "@/lib/i18n";
import { useDisplayPreferences } from "./display-preferences";
import { Icon } from "./icon";

export function LanguagePicker() {
  const { locale, setLocale, t } = useDisplayPreferences();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = languages.find((language) => language.code === locale)!;

  useEffect(() => {
    if (!open) return;
    container.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();

    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="language-picker" ref={container} onBlur={(event) => {
      if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      {open && (
        <section className="language-panel" id="language-panel" role="dialog" aria-modal="false" aria-labelledby="language-title" aria-describedby="language-description">
          <div className="language-panel-heading">
            <span className="language-panel-icon"><Icon name="globe" /></span>
            <button className="icon-button close-language" onClick={close} aria-label={t.close}><Icon name="close" /></button>
          </div>
          <h2 id="language-title">{t.language}</h2>
          <p id="language-description">{t.languageHint}</p>
          <ul className="language-list">
            {languages.map((language) => (
              <li key={language.code}>
                <button aria-pressed={locale === language.code} onClick={() => { setLocale(language.code); close(); }}>
                  <span className={`flag flag-${language.country}`} aria-hidden="true" />
                  <span lang={language.code}>{language.name}</span>
                  <span className="language-code">{language.code.toUpperCase()}</span>
                  {locale === language.code && <Icon name="check" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <button className="language-trigger" ref={trigger} aria-label={`${t.language}: ${active.name}`} aria-expanded={open} aria-controls={open ? "language-panel" : undefined} aria-haspopup="dialog" onClick={() => setOpen(!open)}>
        <span className={`flag flag-${active.country}`} aria-hidden="true" />
        <span lang={locale}>{active.name}</span>
        <span className="language-trigger-divider" />
        <Icon name="chevron" className={open ? "chevron" : "chevron chevron-up"} />
      </button>
    </div>
  );
}
