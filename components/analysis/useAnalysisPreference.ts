"use client";

import { useEffect, useRef, useState } from "react";
import { loadGuestIncludePastWeeks, saveGuestIncludePastWeeks } from "@/lib/state/analysisPreferences";

async function saveAccount(value: boolean, initializeOnly: boolean): Promise<boolean> {
  const response = await fetch("/api/analysis-preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ includePastWeeks: value, initializeOnly }),
  });
  if (!response.ok) throw new Error("Save failed");
  const data = await response.json();
  if (typeof data.includePastWeeks !== "boolean") throw new Error("Invalid preference response");
  return data.includePastWeeks;
}

export function useAnalysisPreference(isAuthenticated: boolean, accountValue: boolean | null) {
  const [includePastWeeks, setIncludePastWeeks] = useState(accountValue ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef({ value: accountValue ?? false, initializeOnly: false });
  const saving = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    const currentRevision = ++revision.current;
    const isCurrent = () => revision.current === currentRevision;
    const cleanup = () => { revision.current++; };
    saving.current = false;
    setBusy(false);
    setError(null);
    if (isAuthenticated && accountValue !== null) {
      setIncludePastWeeks(accountValue);
      return cleanup;
    }
    const guestValue = loadGuestIncludePastWeeks();
    setIncludePastWeeks(guestValue);
    if (!isAuthenticated) return cleanup;
    pending.current = { value: guestValue, initializeOnly: true };
    setBusy(true);
    saving.current = true;
    void saveAccount(guestValue, true)
      .then(value => { if (isCurrent()) setIncludePastWeeks(value); })
      .catch(() => { if (isCurrent()) setError("Could not save account preference."); })
      .finally(() => { if (isCurrent()) { setBusy(false); saving.current = false; } });
    return cleanup;
  }, [isAuthenticated, accountValue]);

  async function save(value: boolean, initializeOnly: boolean) {
    if (saving.current) return;
    const currentRevision = revision.current;
    pending.current = { value, initializeOnly };
    setIncludePastWeeks(value);
    setError(null);
    saving.current = true;
    setBusy(true);
    try {
      if (isAuthenticated) {
        const savedValue = await saveAccount(value, initializeOnly);
        if (revision.current === currentRevision) setIncludePastWeeks(savedValue);
      } else saveGuestIncludePastWeeks(value);
    } catch {
      if (revision.current === currentRevision) setError(isAuthenticated ? "Could not save account preference." : "Could not remember preference in this browser.");
    } finally {
      if (revision.current === currentRevision) {
        saving.current = false;
        setBusy(false);
      }
    }
  }

  return {
    includePastWeeks, busy, error,
    change: (value: boolean) => save(value, false),
    retry: () => save(pending.current.value, pending.current.initializeOnly),
  };
}
