// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const boundary = vi.hoisted(() => ({ identity: vi.fn(), read: vi.fn(), insert: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/db/context", () => ({ withDatabaseIdentity: boundary.identity }));
import { getOwnedTrackIds, getFavoriteSeriesNames, setTrackOwned, setSeriesFavorite } from "@/lib/db/preferences";
beforeEach(() => {
  vi.resetAllMocks();
  const model = { findMany: boundary.read, createMany: boundary.insert, deleteMany: boundary.remove };
  boundary.identity.mockImplementation(async (_id, run) => run({ userOwnedTrack: model, userFavoriteSeries: model }));
});
describe("scoped preferences", () => {
  it("loads only the acting user's track ids", async () => {
    boundary.read.mockResolvedValue([{ trackId: 12 }, { trackId: 89 }]);
    expect(await getOwnedTrackIds("a")).toEqual([12, 89]);
    expect(boundary.identity).toHaveBeenCalledWith("a", expect.any(Function));
    expect(boundary.read).toHaveBeenCalledWith({ where: { userId: "a" }, select: { trackId: true } });
  });
  it("loads only the acting user's favorite series", async () => {
    boundary.read.mockResolvedValue([{ seriesName: "GT3" }]);
    expect(await getFavoriteSeriesNames("b")).toEqual(["GT3"]);
    expect(boundary.identity).toHaveBeenCalledWith("b", expect.any(Function));
    expect(boundary.read).toHaveBeenCalledWith({ where: { userId: "b" }, select: { seriesName: true } });
  });
  it.each([true, false])("sets ownership=%s without an UPDATE/RETURNING requirement", async (owned) => {
    await setTrackOwned("a", 12, owned);
    expect(boundary.identity).toHaveBeenCalledWith("a", expect.any(Function));
    if (owned) expect(boundary.insert).toHaveBeenCalledWith({ data: [{ userId: "a", trackId: 12 }], skipDuplicates: true });
    else expect(boundary.remove).toHaveBeenCalledWith({ where: { userId: "a", trackId: 12 } });
  });
  it.each([true, false])("sets favorite=%s using the user and item", async (favorite) => {
    await setSeriesFavorite("b", "GT3", favorite);
    if (favorite) expect(boundary.insert).toHaveBeenCalledWith({ data: [{ userId: "b", seriesName: "GT3" }], skipDuplicates: true });
    else expect(boundary.remove).toHaveBeenCalledWith({ where: { userId: "b", seriesName: "GT3" } });
  });
  it("propagates a database failure", async () => {
    boundary.read.mockRejectedValue(new Error("db failed"));
    await expect(getOwnedTrackIds("a")).rejects.toThrow("db failed");
  });
});
