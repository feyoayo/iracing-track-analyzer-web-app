export type SavedSelection = {
  selectedClass: string;
  selectedSeries: string[];
};

const STORAGE_KEY = "iracing-track-analyzer-selection";

export function loadSelection(): SavedSelection | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object" || !("selectedClass" in value)
      || typeof value.selectedClass !== "string" || !("selectedSeries" in value)
      || !Array.isArray(value.selectedSeries) || !value.selectedSeries.every(item => typeof item === "string")) {
      return null;
    }
    return { selectedClass: value.selectedClass, selectedSeries: value.selectedSeries };
  } catch {
    return null;
  }
}

export function saveSelection(value: SavedSelection): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Selection remains usable when browser storage is blocked or full.
  }
}
