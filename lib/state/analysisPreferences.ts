const KEY = "iracing-track-analyzer-include-past-weeks";

export function loadGuestIncludePastWeeks(): boolean {
  try { return window.localStorage.getItem(KEY) === "true"; }
  catch { return false; }
}

export function saveGuestIncludePastWeeks(value: boolean): void {
  window.localStorage.setItem(KEY, String(value));
}
