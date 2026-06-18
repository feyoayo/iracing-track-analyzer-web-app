import { Clock3, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { TrackUsageResult } from "@/lib/tracks/findTrackUsage";

export function TrackUsagePanel({ usage }: { usage: TrackUsageResult }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Track history
          </p>
          <h2 className="mt-1 text-lg font-semibold">{usage.trackName}</h2>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          {usage.history.length} total appearances
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Current season</h3>
        </div>
        <div className="grid gap-2">
          {usage.currentSeason.map((row) => (
            <div
              key={`${row.seriesName}-${row.weekNumber}`}
              className="rounded-md border bg-background p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-medium">{row.seriesName}</strong>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  W{row.weekNumber}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{row.raceDate}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">History</h3>
        </div>
        <ScrollArea className="h-80 pr-3">
          <div className="grid gap-2">
            {usage.history.map((row) => (
              <div
                key={`${row.seasonName}-${row.seriesName}-${row.weekNumber}`}
                className="rounded-md border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm font-medium">{row.seasonName}</strong>
                  <Badge variant="outline">W{row.weekNumber}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {row.seriesName}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
