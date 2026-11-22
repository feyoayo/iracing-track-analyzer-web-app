import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SeriesPageClient } from "@/components/series/SeriesPageClient";
import { TracksPageClient } from "@/components/tracks/TracksPageClient";
import type { PreparedSeason } from "@/lib/types";
import { useAnalysisPreference } from "@/components/analysis/useAnalysisPreference";
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const season: PreparedSeason = {
  seasonSlug: "2026-season-4", seasonName: "2026 Season 4",
  series: [{ seriesName: "GT3", seriesClass: "Sports Car", weeks: [
    { trackId: 10, trackName: "Spa", weekNumber: 1, raceDate: "2026-09-15" },
  ] }],
};

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it.each(["series", "tracks"])("invalidates prefetched pages after saving %s preferences", async page => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  render(page === "series"
    ? <SeriesPageClient season={season} isAuthenticated initialFavoriteSeries={[]} />
    : <TracksPageClient season={season} isAuthenticated initialOwnedTrackIds={[]} />);
  fireEvent.click(screen.getByRole("checkbox"));
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
  await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
});

it("invalidates prefetched planning after saving the account week preference", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ includePastWeeks: true }) }));
  const { result } = renderHook(() => useAnalysisPreference(true, false));
  await act(() => result.current.change(true));
  expect(result.current.includePastWeeks).toBe(true);
  expect(router.refresh).toHaveBeenCalledOnce();
});
