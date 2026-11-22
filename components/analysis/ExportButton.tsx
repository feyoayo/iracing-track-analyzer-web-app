"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";
import { buildWorkbook } from "@/lib/excel/buildWorkbook";

export function ExportButton({ result }: { result: AnalysisResult | null }) {
  const { t, locale } = useI18n();
  return (
    <Button
      className="w-full"
      type="button"
      disabled={!result}
      onClick={() => {
        if (!result) {
          return;
        }

        const workbook = buildWorkbook(result, locale);
        XLSX.writeFile(workbook, "analysis.xlsx");
      }}
    >
      <Download className="h-4 w-4" />
      {t("Export Excel")}
    </Button>
  );
}
