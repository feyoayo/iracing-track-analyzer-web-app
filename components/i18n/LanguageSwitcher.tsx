"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function change(next: Locale) {
    if (busy || next === locale) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/locale", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      if (!response.ok) throw new Error("Save failed");
      setLocale(next);
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  return (
    <div className="grid gap-1">
      <div role="group" aria-label={t("Language")} aria-busy={busy} className="flex w-fit gap-1 rounded-lg border bg-background p-1">
        {([{ value: "en", label: "EN", flag: "🇬🇧", name: "English" }, { value: "uk", label: "UA", flag: "🇺🇦", name: "Українська" }] as const).map(item => (
          <button key={item.value} type="button" lang={item.value} aria-label={item.name}
            aria-pressed={locale === item.value} disabled={busy} onClick={() => void change(item.value)}
            className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", locale === item.value && "bg-primary/10 text-primary ring-1 ring-primary/20")}>
            <span aria-hidden="true" className="text-base leading-none">{item.flag}</span>{item.label}
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="max-w-52 text-xs text-destructive">{t("Could not save language. Please try again.")}</p> : null}
    </div>
  );
}
