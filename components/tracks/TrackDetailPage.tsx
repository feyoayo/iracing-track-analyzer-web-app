import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, History, Route } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { TrackUsagePanel } from "@/components/tracks/TrackUsagePanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TrackUsageResult } from "@/lib/tracks/findTrackUsage";

export function TrackDetailPage({
  seasonName,
  usage,
  authSlot,
  utilitySlot,
}: {
  seasonName: string;
  usage: TrackUsageResult;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-6">
      <SiteHeader
        currentTab="tracks"
        seasonName={seasonName}
        title={usage.trackName}
        description="Current-season usage and prepared historical appearances for the selected track."
        authSlot={authSlot}
        utilitySlot={utilitySlot}
      />

      <div>
        <Link
          href="/tracks"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tracks
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="grid gap-4">
          <Card>
            <CardContent className="grid gap-4 p-5">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Route className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.12em]">
                    Current season
                  </span>
                </div>
                <strong className="text-3xl font-semibold">
                  {usage.currentSeason.length}
                </strong>
                <p className="text-sm text-muted-foreground">
                  Appearances in {seasonName}
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <History className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.12em]">
                    Prepared history
                  </span>
                </div>
                <strong className="text-3xl font-semibold">
                  {usage.history.length}
                </strong>
                <p className="text-sm text-muted-foreground">Total indexed rows</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(usage.currentSeason.map((row) => row.seriesClass))).map(
                  (seriesClass) => (
                    <Badge key={seriesClass} variant="secondary">
                      {seriesClass}
                    </Badge>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        <Card>
          <CardContent className="p-5">
            <TrackUsagePanel usage={usage} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
