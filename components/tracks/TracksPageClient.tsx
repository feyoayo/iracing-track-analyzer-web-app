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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizePreparedSeason } from "@/lib/data/seriesClassOverrides";
import { buildTrackDirectory } from "@/lib/tracks/findTrackUsage";
import type { PreparedSeason } from "@/lib/types";

const PAGE_SIZE = 12;
type SortKey = "name" | "appears";
type SortDirection = "asc" | "desc";

export function TracksPageClient({
  season,
  authSlot,
  utilitySlot,
  isAuthenticated,
  initialOwnedTrackIds,
}: {
  season: PreparedSeason;
  authSlot?: ReactNode;
  utilitySlot?: ReactNode;
  isAuthenticated: boolean;
  initialOwnedTrackIds: number[];
}) {
  const normalizedSeason = useMemo(() => normalizePreparedSeason(season), [season]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [ownedTrackIds, setOwnedTrackIds] = useState<Set<number>>(
    () => new Set(initialOwnedTrackIds),
  );
  const [pendingTrackIds, setPendingTrackIds] = useState<Set<number>>(
    () => new Set(),
  );
  const deferredQuery = useDeferredValue(query);

  const tracks = useMemo(
    () => buildTrackDirectory(normalizedSeason),
    [normalizedSeason],
  );
  const filteredTracks = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const matchedTracks = !needle
      ? tracks
      : tracks.filter((track) =>
          track.trackName.toLowerCase().includes(needle),
        );

    return [...matchedTracks].sort((left, right) => {
      if (sortKey === "appears") {
        const diff = left.currentSeasonAppears - right.currentSeasonAppears;
        if (diff !== 0) {
          return sortDirection === "asc" ? diff : -diff;
        }
      } else {
        const diff = left.trackName.localeCompare(right.trackName);
        if (diff !== 0) {
          return sortDirection === "asc" ? diff : -diff;
        }
      }

      return left.trackName.localeCompare(right.trackName);
    });
  }, [deferredQuery, sortDirection, sortKey, tracks]);

  const setSorting = (nextKey: SortKey) => {
    startTransition(() => setPage(1));
    if (nextKey === sortKey) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "name" ? "asc" : "desc");
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    if (key === "name") {
      return sortDirection === "asc" ? (
        <ArrowDownAZ className="h-4 w-4 text-primary" />
      ) : (
        <ArrowUpAZ className="h-4 w-4 text-primary" />
      );
    }

    return (
      <ArrowUpDown
        className={`h-4 w-4 ${sortDirection === "asc" ? "text-primary" : "rotate-180 text-primary"}`}
      />
    );
  };

  const totalPages = Math.max(1, Math.ceil(filteredTracks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleTracks = filteredTracks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-6">
      <SiteHeader
        currentTab="tracks"
        seasonName={season.seasonName}
        title="Tracks"
        description="Search the active season, scan every current track, and drill into full appearance history."
        authSlot={authSlot}
        utilitySlot={utilitySlot}
      />

      <Card>
        <CardContent className="grid gap-6 p-5">
          <div className="grid gap-2">
            <label
              htmlFor="track-lookup"
              className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              Track lookup
            </label>
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="track-lookup"
                className="pl-9"
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setQuery(nextValue);
                  startTransition(() => setPage(1));
                }}
                placeholder="Find a track"
              />
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Search for a track to inspect current-season usage and past appearances.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Track directory
              </p>
              <h2 className="mt-1 text-lg font-semibold">Current season tracks</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredTracks.length} tracks
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
                      onClick={() => setSorting("name")}
                    >
                      Name
                      {renderSortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 font-medium text-inherit"
                      onClick={() => setSorting("appears")}
                    >
                      Current season appears
                      {renderSortIcon("appears")}
                    </button>
                  </TableHead>
                  {isAuthenticated ? <TableHead>Owned</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTracks.map((track) => (
                  <TableRow key={track.trackId}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/tracks/${track.trackId}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {track.trackName}
                      </Link>
                    </TableCell>
                    <TableCell>{track.currentSeasonAppears}</TableCell>
                    {isAuthenticated ? (
                      <TableCell>
                        <Checkbox
                          aria-label={`Mark ${track.trackName} as owned`}
                          checked={ownedTrackIds.has(track.trackId)}
                          disabled={pendingTrackIds.has(track.trackId)}
                          onCheckedChange={async (checked) => {
                            const nextOwned = checked === true;

                            setPendingTrackIds((current) => {
                              const next = new Set(current);
                              next.add(track.trackId);
                              return next;
                            });
                            setOwnedTrackIds((current) => {
                              const next = new Set(current);
                              if (nextOwned) {
                                next.add(track.trackId);
                              } else {
                                next.delete(track.trackId);
                              }
                              return next;
                            });

                            const response = await fetch("/api/owned-tracks", {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                trackId: track.trackId,
                                owned: nextOwned,
                              }),
                            });

                            if (!response.ok) {
                              setOwnedTrackIds((current) => {
                                const next = new Set(current);
                                if (nextOwned) {
                                  next.delete(track.trackId);
                                } else {
                                  next.add(track.trackId);
                                }
                                return next;
                              });
                            }

                            setPendingTrackIds((current) => {
                              const next = new Set(current);
                              next.delete(track.trackId);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
                {visibleTracks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAuthenticated ? 3 : 2}
                      className="py-10 text-muted-foreground"
                    >
                      No tracks match “{query.trim()}”.
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
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
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
