import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { SeriesPageClient } from "@/components/series/SeriesPageClient";
import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import type { PreparedSeason } from "@/lib/types";

const season: PreparedSeason = { seasonSlug: "2026-season-3", seasonName: "2026 Season 3", series: [
  { seriesName: "GT Sprint", seriesClass: "Sports Car", weeks: [] },
  { seriesName: "Formula Test", seriesClass: "Formula", weeks: [] },
] };
afterEach(cleanup);
describe("translated class filters", () => {
  it("uses canonical class values when selecting Ukrainian labels and switching language", async () => {
    Element.prototype.scrollIntoView = () => {};
    const page = <SeriesPageClient season={season} isAuthenticated={false} initialFavoriteSeries={[]} />;
    const view = render(<I18nProvider initialLocale="uk">{page}</I18nProvider>);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    fireEvent.click(await screen.findByRole("option", { name: "Спорткари" }));
    expect(screen.getByRole("link", { name: "GT Sprint" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Formula Test" })).not.toBeInTheDocument();
    view.rerender(<I18nProvider initialLocale="en">{page}</I18nProvider>);
    expect(screen.getByRole("combobox")).toHaveTextContent("Sports Car");
    expect(screen.getByRole("link", { name: "GT Sprint" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    fireEvent.click(await screen.findByRole("option", { name: "All" }));
    expect(screen.getByRole("link", { name: "Formula Test" })).toBeInTheDocument();
  });
  it("keeps the same class icon when translating the class label", () => {
    const filters = <AnalysisFilters classes={["Sports Car"]} selectedClasses={["Sports Car"]} seriesNames={[]} selectedSeries={[]} onClassToggle={() => {}} onSeriesToggle={() => {}} onSelectAllSeries={() => {}} onClearSeries={() => {}} />;
    const view = render(<I18nProvider initialLocale="en">{filters}</I18nProvider>);
    const icon = screen.getByRole("button", { name: /Classes:/ }).querySelector("svg")?.outerHTML;
    view.rerender(<I18nProvider initialLocale="uk">{filters}</I18nProvider>);
    expect(screen.getByRole("button", { name: /Класи:/ }).querySelector("svg")?.outerHTML).toBe(icon);
  });
});
