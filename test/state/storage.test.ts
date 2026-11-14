import { beforeEach, describe, expect, it } from "vitest";
import { loadSelection, saveSelection } from "@/lib/state/storage";
const key = "iracing-track-analyzer-selection";
beforeEach(() => localStorage.clear());
describe("class selection storage", () => {
  it("restores a legacy single class", () => {
    localStorage.setItem(key, JSON.stringify({ selectedClass: "Formula", selectedSeries: ["F4"] }));
    expect(loadSelection()).toEqual({ selectedClasses: ["Formula"], selectedSeries: ["F4"] });
  });
  it("remembers multiple classes and an explicitly empty selection", () => {
    for (const selectedClasses of [["Sports Car", "Formula"], []]) {
      const value = { selectedClasses, selectedSeries: [] };
      saveSelection(value);
      expect(loadSelection()).toEqual(value);
    }
  });
  it("rejects malformed class selections", () => {
    localStorage.setItem(key, JSON.stringify({ selectedClasses: [3], selectedSeries: [] }));
    expect(loadSelection()).toBeNull();
  });
});
