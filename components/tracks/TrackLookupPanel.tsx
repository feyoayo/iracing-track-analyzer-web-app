import type { TrackUsageResult } from "@/lib/tracks/findTrackUsage";

export function TrackLookupPanel({ usage }: { usage: TrackUsageResult | null }) {
  if (!usage) {
    return (
      <p className="empty-state">
        Search for a track to inspect current and historical usage.
      </p>
    );
  }

  return (
    <section className="track-usage">
      <h2>{usage.trackName}</h2>

      <div>
        <h3>Current season</h3>
        <ul>
          {usage.currentSeason.map((row) => (
            <li key={`${row.seriesName}-${row.weekNumber}`}>
              {row.seriesName} · W{row.weekNumber} · {row.raceDate}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>History</h3>
        <ul>
          {usage.history.map((row) => (
            <li key={`${row.seasonName}-${row.seriesName}-${row.weekNumber}`}>
              {row.seasonName} · {row.seriesName} · W{row.weekNumber}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
