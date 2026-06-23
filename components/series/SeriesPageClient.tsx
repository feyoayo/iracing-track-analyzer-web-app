"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown, Search } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizePreparedSeason } from "@/lib/data/seriesClassOverrides";
import type { PreparedSeason } from "@/lib/types";

const PAGE_SIZE = 12;
type SortKey = "name" | "favourite";
type SortDirection = "asc" | "desc";

export function SeriesPageClient({
  season,
  authSlot,
  utilitySlot,
  isAuthenticated,
  initialFavoriteSeries,
}: {
  season: PreparedSeason;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
  isAuthenticated: boolean;
  initialFavoriteSeries: string[];
}) {
  const normalizedSeason = useMemo(() => normalizePreparedSeason(season), [season]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const classOptions = useMemo(
    () => ["All", ...new Set(normalizedSeason.series.map((series) => series.seriesClass))],
    [normalizedSeason.series],
  );
  const [selectedClass, setSelectedClass] = useState("All");
  const [favoriteSeries, setFavoriteSeries] = useState<Set<string>>(
    () => new Set(initialFavoriteSeries),
  );
  const [pendingSeries, setPendingSeries] = useState<Set<string>>(() => new Set());
  const deferredQuery = useDeferredValue(query);

  const filteredSeries = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const classFilteredSeries =
      selectedClass === "All"
        ? normalizedSeason.series
        : normalizedSeason.series.filter(
            (series) => series.seriesClass === selectedClass,
          );
    const matchedSeries = !needle
      ? classFilteredSeries
      : classFilteredSeries.filter((series) =>
          series.seriesName.toLowerCase().includes(needle),
        );

    return [...matchedSeries].sort((left, right) => {
      if (sortKey === "favourite") {
        const leftFavorite = favoriteSeries.has(left.seriesName) ? 1 : 0;
        const rightFavorite = favoriteSeries.has(right.seriesName) ? 1 : 0;
        const diff = leftFavorite - rightFavorite;

        if (diff !== 0) {
          return sortDirection === "asc" ? diff : -diff;
        }
      }

      const diff = left.seriesName.localeCompare(right.seriesName);
      return sortDirection === "asc" ? diff : -diff;
    });
  }, [
    deferredQuery,
    favoriteSeries,
    normalizedSeason.series,
    selectedClass,
    sortDirection,
    sortKey,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSeries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleSeries = filteredSeries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-6">
      <SiteHeader
        currentTab="series"
        seasonName={season.seasonName}
        title="Series"
        description="Browse the active season series list and mark your favorites for future planning."
        authSlot={authSlot}
        utilitySlot={utilitySlot}
      />

      <Card>
        <CardContent className="grid gap-6 p-5">
          <div className="grid gap-2">
            <label
              htmlFor="series-lookup"
              className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              Series lookup
            </label>
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="series-lookup"
                className="pl-9"
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setQuery(nextValue);
                  startTransition(() => setPage(1));
                }}
                placeholder="Find a series"
              />
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Open a series to inspect its current-season schedule and mark favorites for later.
            </p>
          </div>

          <div className="grid max-w-xs gap-2">
            <Label htmlFor="series-class-filter">Series type</Label>
            <Select
              value={selectedClass}
              onValueChange={(value) => {
                setSelectedClass(value);
                startTransition(() => setPage(1));
              }}
            >
              <SelectTrigger id="series-class-filter">
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Series directory
              </p>
              <h2 className="mt-1 text-lg font-semibold">Current season series</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredSeries.length} series
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 font-medium text-inherit"
                      onClick={() => {
                        startTransition(() => setPage(1));
                        if (sortKey === "name") {
                          setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
                          return;
                        }

                        setSortKey("name");
                        setSortDirection("asc");
                      }}
                    >
                      Name
                      {sortKey === "name" ? (
                        sortDirection === "asc" ? (
                          <ArrowDownAZ className="h-4 w-4 text-primary" />
                        ) : (
                          <ArrowUpAZ className="h-4 w-4 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableHead>
                  {isAuthenticated ? (
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 font-medium text-inherit"
                        onClick={() => {
                          startTransition(() => setPage(1));
                          if (sortKey === "favourite") {
                            setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
                            return;
                          }

                          setSortKey("favourite");
                          setSortDirection("desc");
                        }}
                      >
                        Favourite
                        {sortKey === "favourite" ? (
                          <ArrowUpDown
                            className={`h-4 w-4 ${sortDirection === "asc" ? "text-primary" : "rotate-180 text-primary"}`}
                          />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSeries.map((series) => (
                  <TableRow key={series.seriesName}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/series/${encodeURIComponent(series.seriesName)}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {series.seriesName}
                      </Link>
                    </TableCell>
                    {isAuthenticated ? (
                      <TableCell>
                        <Checkbox
                          aria-label={`Mark ${series.seriesName} as favourite`}
                          checked={favoriteSeries.has(series.seriesName)}
                          disabled={pendingSeries.has(series.seriesName)}
                          onCheckedChange={async (checked) => {
                            const nextFavorite = checked === true;

                            setPendingSeries((current) => {
                              const next = new Set(current);
                              next.add(series.seriesName);
                              return next;
                            });
                            setFavoriteSeries((current) => {
                              const next = new Set(current);
                              if (nextFavorite) {
                                next.add(series.seriesName);
                              } else {
                                next.delete(series.seriesName);
                              }
                              return next;
                            });

                            const response = await fetch("/api/favorite-series", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                seriesName: series.seriesName,
                                favorite: nextFavorite,
                              }),
                            });

                            if (!response.ok) {
                              setFavoriteSeries((current) => {
                                const next = new Set(current);
                                if (nextFavorite) {
                                  next.delete(series.seriesName);
                                } else {
                                  next.add(series.seriesName);
                                }
                                return next;
                              });
                            }

                            setPendingSeries((current) => {
                              const next = new Set(current);
                              next.delete(series.seriesName);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
                {visibleSeries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAuthenticated ? 2 : 1}
                      className="py-10 text-muted-foreground"
                    >
                      No series match “{query.trim()}”.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
