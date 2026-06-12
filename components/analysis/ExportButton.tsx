"use client";

import * as XLSX from "xlsx";

import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";
import { buildWorkbook } from "@/lib/excel/buildWorkbook";

export function ExportButton({ result }: { result: AnalysisResult | null }) {
  return (
    <button
      className="export-button"
      type="button"
      disabled={!result}
      onClick={() => {
        if (!result) {
          return;
        }

        const workbook = buildWorkbook(result);
        XLSX.writeFile(workbook, "analysis.xlsx");
      }}
    >
      Export Excel
    </button>
  );
}
