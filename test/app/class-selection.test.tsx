import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppClient } from "@/components/app/AppClient";
import type { PreparedSeason } from "@/lib/types";
const season: PreparedSeason = {
  seasonSlug: "2026-season-4", seasonName: "2026 Season 4",
  series: [
    { seriesName: "GT3 Test", seriesClass: "Sports Car", weeks: [] },
    { seriesName: "Formula Test", seriesClass: "Formula", weeks: [] },
    { seriesName: "Oval Test", seriesClass: "Oval", weeks: [] },
  ],
};
const props = { season, initialFavoriteSeries: [], ownedTrackIds: [], isAuthenticated: false };
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/"); });
afterEach(cleanup);
async function openClasses() {
  fireEvent.keyDown(screen.getByRole("button", { name: /Classes/ }), { key: "Enter" });
  return screen.findByRole("menuitemcheckbox", { name: "Formula" });
}
describe("multiple class selection", () => {
  it("uses shared URL classes ahead of saved choices and favorites", () => {
    window.history.replaceState(null, "", "/?classes=formula,oval&utm_source=share#filters");
    localStorage.setItem("iracing-track-analyzer-selection", JSON.stringify({ selectedClasses: ["Sports Car"], selectedSeries: ["GT3 Test"] }));
    render(<AppClient {...props} initialFavoriteSeries={["GT3 Test", "Formula Test"]} />);
    expect(screen.queryByRole("checkbox", { name: "GT3 Test" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Formula Test" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Oval Test" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#filters");
    expect(new URLSearchParams(window.location.search).get("utm_source")).toBe("share");
  });
  it("writes toggles to the URL and restores them after reopening", async () => {
    const view = render(<AppClient {...props} />);
    fireEvent.click(await openClasses());
    expect(new URLSearchParams(window.location.search).get("classes")).toBe("sports-car,formula");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    view.unmount();
    localStorage.clear();
    render(<AppClient {...props} />);
    expect(screen.getByRole("checkbox", { name: "GT3 Test" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Formula Test" })).toBeInTheDocument();
  });
  it("supports an explicitly empty URL selection and browser navigation", () => {
    window.history.replaceState(null, "", "/?classes=");
    render(<AppClient {...props} />);
    expect(screen.queryByRole("checkbox", { name: "GT3 Test" })).not.toBeInTheDocument();
    window.history.replaceState(null, "", "/?classes=oval");
    fireEvent.popState(window);
    expect(screen.getByRole("checkbox", { name: "Oval Test" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "GT3 Test" })).not.toBeInTheDocument();
  });
  it("adds a class without losing selected series and removes only the excluded class series", async () => {
    render(<AppClient {...props} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "GT3 Test" }));
    fireEvent.click(await openClasses());
    expect(screen.getByRole("menuitemcheckbox", { name: "Sports Car" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Formula" })).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.getByRole("checkbox", { name: "GT3 Test" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Formula Test" }));
    await openClasses();
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Sports Car" }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("checkbox", { name: "GT3 Test" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Formula Test" })).toBeChecked();
  });
  it("restores favorites across classes", () => {
    render(<AppClient {...props} initialFavoriteSeries={["GT3 Test", "Formula Test"]} />);
    expect(screen.getByRole("checkbox", { name: "GT3 Test" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Formula Test" })).toBeChecked();
  });
});
