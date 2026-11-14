// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: deps.createClient }));
import { PUT } from "@/app/api/analysis-preferences/route";
const request = (body: unknown) => new Request("http://localhost/api/analysis-preferences", { method: "PUT", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  deps.createClient.mockResolvedValue({ auth: { getUser: deps.getUser, updateUser: deps.updateUser } });
  deps.getUser.mockResolvedValue({ data: { user: { id: "verified", user_metadata: {} } }, error: null });
  deps.updateUser.mockResolvedValue({ data: { user: { user_metadata: { include_past_weeks: true } } }, error: null });
});
describe("analysis preference API", () => {
  it("requires verified authentication", async () => {
    deps.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await PUT(request({ includePastWeeks: true }))).status).toBe(401);
    expect(deps.updateUser).not.toHaveBeenCalled();
  });
  it.each([null, [], true, { includePastWeeks: "false" }, { includePastWeeks: 1 }, { includePastWeeks: false, initializeOnly: "true" }])("rejects invalid input %s", async body => {
    expect((await PUT(request(body))).status).toBe(400);
    expect(deps.updateUser).not.toHaveBeenCalled();
  });
  it("saves only the preference to the signed-in account", async () => {
    const response = await PUT(request({ includePastWeeks: true, userId: "someone-else" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ includePastWeeks: true });
    expect(deps.updateUser).toHaveBeenCalledWith({ data: { include_past_weeks: true } });
  });
  it("does not overwrite an existing account choice when importing a guest choice", async () => {
    deps.getUser.mockResolvedValue({ data: { user: { id: "verified", user_metadata: { include_past_weeks: false } } }, error: null });
    const response = await PUT(request({ includePastWeeks: true, initializeOnly: true }));
    expect(await response.json()).toEqual({ includePastWeeks: false });
    expect(deps.updateUser).not.toHaveBeenCalled();
  });
  it("returns save errors without leaking details", async () => {
    deps.updateUser.mockResolvedValue({ error: new Error("secret") });
    const response = await PUT(request({ includePastWeeks: true }));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
  });
  it("rejects cross-origin updates", async () => {
    const response = await PUT(new Request("http://localhost/api/analysis-preferences", { method: "PUT", headers: { origin: "https://other.example" }, body: JSON.stringify({ includePastWeeks: true }) }));
    expect(response.status).toBe(403);
    expect(deps.updateUser).not.toHaveBeenCalled();
  });
});
