import type { ReactNode } from "react";

import { CalendarRange, Route, SlidersHorizontal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function AppShell({
  seasonName,
  controls,
  analysis,
  trackLookup,
}: {
  seasonName: string;
  controls: ReactNode;
  analysis: ReactNode;
  trackLookup: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            iRacing Schedule Analyzer
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-balance md:text-4xl">
            Current season planning
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Compare series overlap, spot high-value tracks, and inspect season
            history without leaving one screen.
          </p>
        </div>

        <Card className="w-full max-w-sm lg:w-auto">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Active season
              </p>
              <strong className="block truncate text-sm font-semibold md:text-base">
                {seasonName}
              </strong>
            </div>
          </CardContent>
        </Card>
      </header>

      <section className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
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

        <aside className="xl:sticky xl:top-6">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Track lookup</span>
              </div>
              {trackLookup}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
