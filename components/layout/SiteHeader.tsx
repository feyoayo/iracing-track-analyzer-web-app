"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarRange } from "lucide-react";

import { SeasonWeek } from "@/components/layout/SeasonWeek";
import type { PreparedSeason } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Season planning", key: "season-planning" },
  { href: "/series", label: "Series", key: "series" },
  { href: "/tracks", label: "Tracks", key: "tracks" },
] as const;

export function SiteHeader({
  currentTab,
  season,
  title,
  description,
  authSlot,
  utilitySlot,
}: {
  currentTab: (typeof NAV_ITEMS)[number]["key"];
  season: PreparedSeason;
  title: string;
  description: string;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="relative left-1/2 w-screen -translate-x-1/2 border-b bg-card">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-4 px-4 py-3 md:px-6">
          <Link
            href="/"
            aria-label={t("Schedule Analyzer — Home")}
            className="relative block aspect-[6/1] w-64 max-w-full shrink-0 overflow-hidden rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Image
              src="/schedule-analyzer-logo.png"
              alt="Schedule Analyzer"
              fill
              sizes="256px"
              className="object-cover"
              priority
            />
          </Link>

          <nav
            aria-label={t("Primary")}
            className="order-last flex w-full items-center gap-1 border-t pt-3 lg:order-none lg:w-auto lg:border-t-0 lg:pt-0"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === currentTab;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CalendarRange className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-sm font-semibold">
                  {season.seasonName}
                </strong>
                <SeasonWeek season={season} />
              </div>
            </div>
            <LanguageSwitcher />
            {authSlot ? (
              <div className="flex flex-wrap items-center gap-2">
                {authSlot ? <div>{authSlot}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {utilitySlot}

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold leading-tight text-balance md:text-4xl">
          {t(title)}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t(description)}
        </p>
      </div>
    </div>
  );
}
