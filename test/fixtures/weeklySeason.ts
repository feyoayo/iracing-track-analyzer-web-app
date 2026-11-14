import type { PreparedSeason } from "@/lib/types";

export const season: PreparedSeason = {
  seasonSlug: "2026-season-4", seasonName: "2026 Season 4",
  series: [
    { seriesName: "Weekly", seriesClass: "Formula", weeks: [
      { trackId: 1, trackName: "Past track", weekNumber: 1, raceDate: "2026-11-03" },
      { trackId: 2, trackName: "Current track", weekNumber: 2, raceDate: "2026-11-10" },
      { trackId: 3, trackName: "Future track", weekNumber: 3, raceDate: "2026-11-17" },
    ] },
    { seriesName: "Special", seriesClass: "Formula", weeks: [
      { trackId: 2, trackName: "Current track", weekNumber: 19, raceDate: "2026-11-03" },
      { trackId: 3, trackName: "Future track", weekNumber: 20, raceDate: "2026-11-17" },
    ] },
  ],
};
