"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";
import { buildWorkbook } from "@/lib/excel/buildWorkbook";

export function ExportButton({ result }: { result: AnalysisResult | null }) {
  return (
    <Button
      className="w-full"
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
      <Download className="h-4 w-4" />
      Export Excel
    </Button>
  );
}
