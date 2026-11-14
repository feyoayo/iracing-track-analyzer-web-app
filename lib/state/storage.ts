export type SavedSelection = {
  selectedClasses: string[];
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
    if (!value || typeof value !== "object" || !("selectedSeries" in value)
      || !Array.isArray(value.selectedSeries) || !value.selectedSeries.every(item => typeof item === "string")) {
      return null;
    }
    const selectedClasses = "selectedClasses" in value
      ? value.selectedClasses
      : "selectedClass" in value && typeof value.selectedClass === "string"
        ? [value.selectedClass]
        : null;
    if (!Array.isArray(selectedClasses) || !selectedClasses.every(item => typeof item === "string")) {
      return null;
    }
    return { selectedClasses: [...new Set(selectedClasses)], selectedSeries: value.selectedSeries };
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
