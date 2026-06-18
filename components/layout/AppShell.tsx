import type { ReactNode } from "react";

import { SlidersHorizontal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function AppShell({
  seasonName,
  controls,
  analysis,
  authSlot,
}: {
  seasonName: string;
  controls: ReactNode;
  analysis: ReactNode;
  authSlot?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-6">
      <SiteHeader
        currentTab="season-planning"
        seasonName={seasonName}
        title="Season planning"
        description="Compare series overlap, spot high-value tracks, and export the current season plan."
        authSlot={authSlot}
      />

      <section className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Filters</span>
              </div>
              <div className="grid gap-5">{controls}</div>
            </CardContent>
          </Card>
        </aside>

        <section>
          <Card>
            <CardContent className="p-5">{analysis}</CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
