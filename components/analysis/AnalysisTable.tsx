import { BarChart3, Layers3, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalysisResult } from "@/lib/analysis/analyzeSchedule";

export function AnalysisTable({ result }: { result: AnalysisResult | null }) {
  if (!result || result.tracks.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-start justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Analysis
        </p>
        <h2 className="text-lg font-semibold">Select at least one series</h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          The table and Excel export update from the selected class and series.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Analysis
          </p>
          <h2 className="mt-1 text-lg font-semibold">Track overlap</h2>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          {result.tracks.length} tracks across {result.seriesNames.length} series
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Route className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.08em]">
              Tracks
            </span>
          </div>
          <strong className="text-2xl font-semibold">{result.tracks.length}</strong>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Layers3 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.08em]">
              Series
            </span>
          </div>
          <strong className="text-2xl font-semibold">
            {result.seriesNames.length}
          </strong>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.08em]">
              Top overlap
            </span>
          </div>
          <strong className="text-2xl font-semibold">
            {result.tracks[0]?.totalCount ?? 0}
          </strong>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Track</TableHead>
              <TableHead>Overlap</TableHead>
              <TableHead>Priority</TableHead>
              {result.seriesNames.map((seriesName) => (
                <TableHead key={seriesName}>{seriesName}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.tracks.map((track) => (
              <TableRow key={track.trackId}>
                <TableCell className="font-medium">{track.trackName}</TableCell>
                <TableCell>{track.totalCount}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="border-transparent"
                    style={{ backgroundColor: `#${track.priorityColor}` }}
                  >
                    {track.priority}
                  </Badge>
                </TableCell>
                {result.seriesNames.map((seriesName) => (
                  <TableCell key={seriesName} className="text-center">
                    {track.seriesWeeks[seriesName] ? (
                      <Badge
                        variant="secondary"
                        className="min-w-11 justify-center bg-primary/10 text-primary"
                      >
                        W{track.seriesWeeks[seriesName][0]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
