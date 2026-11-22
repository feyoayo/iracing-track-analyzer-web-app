import { readFileSync } from "node:fs";
import path from "node:path";

import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { analyzeSchedule } from "@/lib/analysis/analyzeSchedule";
import { parsePreparedSeason } from "@/lib/data/loaders";
import { buildWorkbook } from "@/lib/excel/buildWorkbook";

describe("buildWorkbook", () => {
  it("exports Ukrainian headings and priorities while keeping racing names unchanged", () => {
    const season = parsePreparedSeason(readFileSync(path.join(process.cwd(), "test/fixtures/prepared-data/schedules/2026-season-3.json"), "utf8"));
    const workbook = buildWorkbook(analyzeSchedule(season, ["GT Sprint", "GT3 Fixed"]), "uk");
    expect(workbook.SheetNames).toEqual(["Матриця трас і серій", "Аналіз пріоритетів", "Повний розклад"]);
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    expect(matrix[0]).toEqual(["Траса", "GT Sprint", "GT3 Fixed"]);
    expect(matrix[1][0]).toBe("Spa-Francorchamps");
    const priorities = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[1]], { header: 1 });
    expect(priorities[0][6]).toBe("Пріоритет");
    expect(priorities[1][6]).toBe("За бажанням");
  });
  it("creates the three expected sheets", () => {
    const season = parsePreparedSeason(
      readFileSync(
        path.join(
          process.cwd(),
          "test/fixtures/prepared-data/schedules/2026-season-3.json",
        ),
        "utf8",
      ),
    );
    const analysis = analyzeSchedule(season, ["GT Sprint", "GT3 Fixed"]);

    const workbook = buildWorkbook(analysis);

    expect(workbook.SheetNames).toEqual([
      "Track x Series Matrix",
      "Must-Have Analysis",
      "Full Schedule",
    ]);

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(
      workbook.Sheets["Track x Series Matrix"],
      {
        header: 1,
      },
    );

    expect(matrix[1][0]).toBe("Spa-Francorchamps");
    expect(matrix[1][1]).toBe(1);
    expect(matrix[1][2]).toBe(4);
  });
});
