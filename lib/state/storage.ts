export type SavedSelection = {
  selectedClass: string;
  selectedSeries: string[];
};

const STORAGE_KEY = "iracing-track-analyzer-selection";

export function loadSelection(): SavedSelection | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SavedSelection) : null;
}

export function saveSelection(value: SavedSelection): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
