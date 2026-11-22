import type { Locale } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/messages";
import type { PreparedSeason } from "@/lib/types";

const DAY = 86_400_000;
const WEEK = 7 * DAY;

function scheduleDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp : null;
}

export function isUpcomingWeek(raceDate: string, now: Date): boolean {
  const start = scheduleDate(raceDate);
  // Undated rounds cannot safely be classified as completed.
  return start === null || start + WEEK > now.getTime();
}

const formatDate = (timestamp: number, locale: Locale) => new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
  month: "short", day: "numeric", timeZone: "UTC",
}).format(timestamp);

export function getSeasonWeekLabel(season: PreparedSeason, now: Date, locale: Locale = "en"): string {
  const weeks = season.series.flatMap(series => series.weeks);
  const starts = new Map<number, number>();
  for (const week of weeks) {
    const date = scheduleDate(week.raceDate);
    if (week.weekNumber === 1 && date !== null) starts.set(date, (starts.get(date) ?? 0) + 1);
  }
  // The most common week-one date defines the regular season calendar.
  // Endurance/special series can use a different round calendar in the same file.
  const start = [...starts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];
  if (start === undefined) return translate(locale, "Schedule dates unavailable");
  const alignedWeeks = weeks.filter(week => scheduleDate(week.raceDate) === start + (week.weekNumber - 1) * WEEK);
  const lastWeek = Math.max(...alignedWeeks.map(week => week.weekNumber));
  const currentWeek = Math.floor((now.getTime() - start) / WEEK) + 1;
  if (currentWeek < 1) return translate(locale, "Season starts {date}", { date: formatDate(start, locale) });
  if (currentWeek > lastWeek) return translate(locale, "Season completed");
  const weekStart = start + (currentWeek - 1) * WEEK;
  const weekEnd = weekStart + 6 * DAY;
  const sameMonth = new Date(weekStart).getUTCMonth() === new Date(weekEnd).getUTCMonth();
  const endLabel = sameMonth && locale === "en" ? new Date(weekEnd).getUTCDate() : formatDate(weekEnd, locale);
  return translate(locale, "Week {week} · {start}–{end}", { week: currentWeek, start: formatDate(weekStart, locale), end: endLabel });
}
