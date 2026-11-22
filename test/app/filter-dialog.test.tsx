import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppClient } from "@/components/app/AppClient";
import type { PreparedSeason } from "@/lib/types";

const season: PreparedSeason = {
  seasonSlug: "2026-season-4", seasonName: "2026 Season 4",
  series: [
    { seriesName: "GT3 Test", seriesClass: "Sports Car", weeks: [] },
    { seriesName: "GT4 Test", seriesClass: "Sports Car", weeks: [] },
    { seriesName: "Formula Test", seriesClass: "Formula", weeks: [] },
  ],
};
const props = { season, initialFavoriteSeries: [], ownedTrackIds: [], isAuthenticated: false };
const key = "iracing-track-analyzer-selection";
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/"); });
afterEach(cleanup);
const openFilters = () => fireEvent.click(screen.getByRole("button", { name: "Filters" }));

describe("analysis filter dialog", () => {
  it("selects all Sports Car series for a user without settings", () => {
    render(<AppClient {...props} />);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ selectedClasses: ["Sports Car"], selectedSeries: ["GT3 Test", "GT4 Test"] });
    expect(screen.queryByRole("checkbox", { name: "GT3 Test" })).not.toBeInTheDocument();
    openFilters();
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "GT3 Test" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "GT4 Test" })).toBeChecked();
  });

  it("preserves an intentionally empty saved selection", () => {
    localStorage.setItem(key, JSON.stringify({ selectedClasses: ["Sports Car"], selectedSeries: [] }));
    render(<AppClient {...props} />);
    openFilters();
    expect(screen.getByRole("checkbox", { name: "GT3 Test" })).not.toBeChecked();
  });

  it("discards edits on Cancel and closing, and commits only on Apply", () => {
    render(<AppClient {...props} />);
    const original = localStorage.getItem(key);
    openFilters();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Include past weeks" }));
    expect(localStorage.getItem(key)).toBe(original);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(localStorage.getItem("iracing-track-analyzer-include-past-weeks")).toBeNull();
    openFilters();
    expect(screen.getByRole("checkbox", { name: "GT3 Test" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Include past weeks" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    openFilters();
    expect(screen.getByRole("checkbox", { name: "GT3 Test" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "GT3 Test" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Include past weeks" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(key)!).selectedSeries).toEqual(["GT4 Test"]);
    expect(localStorage.getItem("iracing-track-analyzer-include-past-weeks")).toBe("true");
  });

  it("keeps hidden selections while searching series", () => {
    render(<AppClient {...props} />);
    openFilters();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search series" }), { target: { value: "gt3" } });
    expect(screen.queryByRole("checkbox", { name: "GT4 Test" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "GT3 Test" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(JSON.parse(localStorage.getItem(key)!).selectedSeries).toEqual(["GT4 Test"]);
  });

  it("selects URL class series when no settings exist", () => {
    window.history.replaceState(null, "", "/?classes=formula");
    render(<AppClient {...props} />);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ selectedClasses: ["Formula"], selectedSeries: ["Formula Test"] });
  });
});
