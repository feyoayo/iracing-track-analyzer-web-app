import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";

export function AnalysisTable({ result }: { result: AnalysisResult | null }) {
  if (!result || result.tracks.length === 0) {
    return <p className="empty-state">No series selected.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="analysis-table">
        <thead>
          <tr>
            <th>Track</th>
            <th>Total</th>
            <th>Priority</th>
            {result.seriesNames.map((seriesName) => (
              <th key={seriesName}>{seriesName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.tracks.map((track) => (
            <tr key={track.trackId}>
              <td>{track.trackName}</td>
              <td>{track.totalCount}</td>
              <td>{track.priority}</td>
              {result.seriesNames.map((seriesName) => (
                <td key={seriesName}>
                  {track.seriesWeeks[seriesName]?.[0] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
