import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/data/preparedData", () => ({ getLatestPreparedData: async () => ({
  season: { seasonSlug: "2026-season-3", seasonName: "2026 Season 3", series: [] },
}) }));
const deps = vi.hoisted(() => ({ getUser: vi.fn(), tracks: vi.fn(), favorites: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: deps.getUser } }) }));
vi.mock("@/components/auth/HeaderAuth", () => ({ HeaderAuth: async () => null }));
vi.mock("@/lib/db/preferences", () => ({ getOwnedTrackIds: deps.tracks, getFavoriteSeriesNames: deps.favorites }));
import Page from "@/app/page";
import TracksPage from "@/app/tracks/page";
import SeriesPage from "@/app/series/page";
beforeEach(() => {
  vi.resetAllMocks();
  deps.getUser.mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
  deps.tracks.mockResolvedValue([12]); deps.favorites.mockResolvedValue(["GT3"]);
});
describe("server preference loading", () => {
  it.each([Page, TracksPage, SeriesPage])("renders anonymous pages without querying private preferences", async (renderPage) => {
    deps.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const element = await renderPage();
    expect(element.props.isAuthenticated).toBe(false);
    expect(deps.tracks).not.toHaveBeenCalled(); expect(deps.favorites).not.toHaveBeenCalled();
  });
  it("loads both lists for the verified user", async () => {
    const element = await Page();
    expect(element.props.ownedTrackIds).toEqual([12]); expect(element.props.initialFavoriteSeries).toEqual(["GT3"]);
    expect(deps.tracks).toHaveBeenCalledWith("verified-user"); expect(deps.favorites).toHaveBeenCalledWith("verified-user");
  });
  it("keeps owned tracks if favorites fail", async () => {
    deps.favorites.mockRejectedValue(new Error("db unavailable"));
    const element = await Page();
    expect(element.props.ownedTrackIds).toEqual([12]); expect(element.props.initialFavoriteSeries).toEqual([]);
  });
  it("keeps favorites if owned tracks fail", async () => {
    deps.tracks.mockRejectedValue(new Error("db unavailable"));
    const element = await Page();
    expect(element.props.ownedTrackIds).toEqual([]); expect(element.props.initialFavoriteSeries).toEqual(["GT3"]);
  });
  it("loads the tracks directory", async () => {
    expect((await TracksPage()).props.initialOwnedTrackIds).toEqual([12]);
  });
  it("loads the series directory", async () => {
    expect((await SeriesPage()).props.initialFavoriteSeries).toEqual(["GT3"]);
  });
  it("falls back to empty lists for failing directory queries", async () => {
    deps.tracks.mockRejectedValue(new Error("db unavailable")); deps.favorites.mockRejectedValue(new Error("db unavailable"));
    expect((await TracksPage()).props.initialOwnedTrackIds).toEqual([]);
    expect((await SeriesPage()).props.initialFavoriteSeries).toEqual([]);
  });
});
