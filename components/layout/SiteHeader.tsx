import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarRange } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Season planning", key: "season-planning" },
  { href: "/series", label: "Series", key: "series" },
  { href: "/tracks", label: "Tracks", key: "tracks" },
] as const;

export function SiteHeader({
  currentTab,
  seasonName,
  title,
  description,
  authSlot,
  utilitySlot,
}: {
  currentTab: (typeof NAV_ITEMS)[number]["key"];
  seasonName: string;
  title: string;
  description: string;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
}) {
  return (
    <header className="grid gap-4">
  {/* {authSlot ? <div>{authSlot}</div> : null} */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            iRacing Schedule Analyzer
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-balance md:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
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
          {utilitySlot || authSlot ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {utilitySlot ? <div>{utilitySlot}</div> : null}
              {authSlot ? <div>{authSlot}</div> : null}
            </div>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="inline-flex w-fit rounded-full border bg-card/80 p-1 shadow-sm backdrop-blur"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === currentTab;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
