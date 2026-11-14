// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn(), read: vi.fn(), write: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: deps.createClient }));
vi.mock("@/lib/db/preferences", () => ({ getOwnedTrackIds: deps.read, setTrackOwned: deps.write }));
import { GET, PUT } from "@/app/api/owned-tracks/route";
const request = (body: unknown) => new Request("http://localhost/api/owned-tracks", { method: "PUT", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  deps.createClient.mockResolvedValue({ auth: { getUser: deps.getUser } });
  deps.getUser.mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
  deps.read.mockResolvedValue([12]);
});
describe("owned-tracks API", () => {
  it("rejects unauthenticated reads and writes before touching the database", async () => {
    deps.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await GET()).status).toBe(401);
    expect((await PUT(request({ trackId: 12, owned: true }))).status).toBe(401);
    expect(deps.read).not.toHaveBeenCalled(); expect(deps.write).not.toHaveBeenCalled();
  });
  it("retains missing auth configuration handling", async () => {
    deps.createClient.mockResolvedValue(null);
    expect((await GET()).status).toBe(500);
  });
  it("returns the existing response contract", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ trackIds: [12] });
    expect(deps.read).toHaveBeenCalledWith("verified-user");
  });
  it.each([true, false])("uses verified identity for owned=%s", async (enabled) => {
    const response = await PUT(request({ trackId: 12, owned: enabled, user_id: "attacker" }));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true });
    expect(deps.write).toHaveBeenCalledWith("verified-user", 12, enabled);
  });
  it.each([0, -1, 1.5, "12", null])("rejects invalid item %s", async (value) => {
    expect((await PUT(request({ trackId: value, owned: true }))).status).toBe(400);
    expect(deps.write).not.toHaveBeenCalled();
  });
  it.each(["true", 1, null])("rejects nonboolean flag %s", async (value) => {
    expect((await PUT(request({ trackId: 12, owned: value }))).status).toBe(400);
  });
  it.each([null, [], "bad"])("rejects nonobject JSON %s", async (body) => {
    expect((await PUT(request(body))).status).toBe(400);
  });
  it("rejects malformed JSON", async () => {
    expect((await PUT(new Request("http://localhost/api", { method: "PUT", body: "{" }))).status).toBe(400);
  });
  it("hides database errors on reads and writes", async () => {
    deps.read.mockRejectedValue(new Error("postgres://secret")); deps.write.mockRejectedValue(new Error("postgres://secret"));
    for (const response of [await GET(), await PUT(request({ trackId: 12, owned: true }))]) {
      expect(response.status).toBe(500); expect(await response.text()).not.toContain("secret");
    }
  });
});
