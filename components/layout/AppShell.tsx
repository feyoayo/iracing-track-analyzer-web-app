import type { PreparedSeason } from "@/lib/types";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function AppShell({
  season,
  analysis,
  authSlot,
  utilitySlot,
}: {
  season: PreparedSeason;
  analysis: ReactNode;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 pb-24 md:px-6">
      <SiteHeader
        currentTab="season-planning"
        season={season}
        title="Season planning"
        description="Compare series overlap, spot high-value tracks, and export the current season plan."
        authSlot={authSlot}
        utilitySlot={utilitySlot}
      />

      <Card className="min-w-0">
        <CardContent className="p-4 md:p-5">{analysis}</CardContent>
      </Card>
    </main>
  );
}
