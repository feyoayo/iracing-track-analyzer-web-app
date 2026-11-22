"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { getSeasonWeekLabel } from "@/lib/analysis/seasonWeek";
import { useScheduleClock } from "@/lib/hooks/useScheduleClock";
import type { PreparedSeason } from "@/lib/types";

export function SeasonWeek({ season }: { season: PreparedSeason }) {
  const { t, locale } = useI18n();
  const now = useScheduleClock();
  return (
    <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
      {now ? getSeasonWeekLabel(season, now, locale) : t("Checking current week…")}
    </p>
  );
}
