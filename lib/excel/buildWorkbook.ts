import type { Locale } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/messages";
import * as XLSX from "xlsx";

import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";

export function buildWorkbook(result: AnalysisResult, locale: Locale = "en"): XLSX.WorkBook {
  const t = (key: string) => translate(locale, key);
  const workbook = XLSX.utils.book_new();

  const matrixRows = [
    [t("Track"), ...result.seriesNames],
    ...result.tracks.map((track) => [
      track.trackName,
      ...result.seriesNames.map(
        (seriesName) => track.seriesWeeks[seriesName]?.[0] ?? "",
      ),
    ]),
  ];

  const mustHaveRows = [
    ["#", t("Track"), t("Total Series"), t("Sports Car"), t("Oval"), t("Formula"), t("Priority")],
    ...result.tracks.map((track, index) => [
      index + 1,
      track.trackName,
      track.totalCount,
      track.classCounts["Sports Car"] ?? 0,
      track.classCounts["Oval"] ?? 0,
      track.classCounts["Formula"] ?? 0,
      t(track.priority),
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

    return [[seriesName], [t("Week"), t("Date"), t("Track")], ...rows, []];
  });

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(matrixRows),
    t("Track x Series Matrix"),
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(mustHaveRows),
    t("Must-Have Analysis"),
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(fullScheduleRows),
    t("Full Schedule"),
  );

  return workbook;
}
