import { expect, it } from "vitest";
import { collapseFixedSeries } from "@/lib/analysis/seriesVariants";

it("matches Fixed variants before sponsor names and explicit links, without hiding other classes", () => {
  const { season, resolveSelection } = collapseFixedSeries({
    seasonSlug: "test", seasonName: "Test",
    series: [
      { id: 1, seriesName: "GT Sprint", seriesClass: "Sports Car", weeks: [] },
      { id: 2, linkedTo: 1, seriesName: "GT Challenge Fixed", seriesClass: "Sports Car", weeks: [] },
      { seriesName: "Porsche Cup by CONSPIT", seriesClass: "Sports Car", weeks: [] },
      { seriesName: "Porsche Cup - Fixed by CONSPIT", seriesClass: "Sports Car", weeks: [] },
      { seriesName: "GT Sprint - Fixed", seriesClass: "Oval", weeks: [] },
      { seriesName: "Fixedness Cup", seriesClass: "Sports Car", weeks: [] },
    ],
  });
  expect(season.series.map(series => series.seriesName)).toEqual([
    "GT Sprint", "Porsche Cup by CONSPIT", "GT Sprint - Fixed", "Fixedness Cup",
  ]);
  expect(resolveSelection(["GT Challenge Fixed", "GT Sprint", "Porsche Cup - Fixed by CONSPIT"]))
    .toEqual(["GT Sprint", "Porsche Cup by CONSPIT"]);
});
