import "server-only";
import { withDatabaseIdentity } from "@/lib/db/context";
import type { PreparedSeason } from "@/lib/types";

export async function getCurrentPreparedSeason(): Promise<PreparedSeason> {
  return withDatabaseIdentity(null, async tx => {
    // Repeatable-read below keeps the nested Prisma reads on one snapshot.
    const current = await tx.season.findFirst({
      where: { isCurrent: true },
      include: { series: { orderBy: { name: "asc" }, include: { weeks: { orderBy: { weekNumber: "asc" } } } } },
    });
    if (!current) throw new Error("No current season is configured. Import a schedule with --current.");
    return {
      seasonSlug: current.slug,
      seasonName: current.name,
      series: current.series.map(series => ({
        id: series.id,
        linkedTo: series.linkedTo,
        seriesName: series.name,
        seriesClass: series.category,
        weeks: series.weeks.map(week => ({
          trackId: week.trackId, trackName: week.trackName, weekNumber: week.weekNumber,
          raceDate: week.raceDate.toISOString().slice(0, 10),
        })),
      })),
    };
  }, { isolationLevel: "RepeatableRead" });
}
