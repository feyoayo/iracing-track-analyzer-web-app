import * as XLSX from "xlsx";

import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";

export function buildWorkbook(result: AnalysisResult): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const matrixRows = [
    ["Track", ...result.seriesNames],
    ...result.tracks.map((track) => [
      track.trackName,
      ...result.seriesNames.map(
        (seriesName) => track.seriesWeeks[seriesName]?.[0] ?? "",
      ),
    ]),
  ];

  const mustHaveRows = [
    ["#", "Track", "Total Series", "Sports Car", "Oval", "Formula", "Priority"],
    ...result.tracks.map((track, index) => [
      index + 1,
      track.trackName,
      track.totalCount,
      track.classCounts["Sports Car"] ?? 0,
      track.classCounts["Oval"] ?? 0,
      track.classCounts["Formula"] ?? 0,
      track.priority,
    ]),
  ];

  const fullScheduleRows = result.seriesNames.flatMap((seriesName) => {
    const rows = result.tracks
      .filter((track) => track.seriesWeeks[seriesName])
      .sort(
        (left, right) =>
          left.seriesWeeks[seriesName][0] - right.seriesWeeks[seriesName][0],
      )
      .map((track) => {
        const [week, date] = track.seriesWeeks[seriesName];
        return [week, date, track.trackName];
      });

    return [[seriesName], ["Week", "Date", "Track"], ...rows, []];
  });

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(matrixRows),
    "Track x Series Matrix",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(mustHaveRows),
    "Must-Have Analysis",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(fullScheduleRows),
    "Full Schedule",
  );

  return workbook;
}
