// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: deps.createClient }));
import { PUT } from "@/app/api/locale/route";
const request = (body: unknown, origin?: string) => new Request("https://example.com/api/locale", {
  method: "PUT", headers: origin ? { origin } : {}, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.resetAllMocks();
  deps.createClient.mockResolvedValue({ auth: { getUser: deps.getUser, updateUser: deps.updateUser } });
  deps.getUser.mockResolvedValue({ data: { user: null }, error: null });
  deps.updateUser.mockResolvedValue({ error: null });
});
describe("language persistence", () => {
  it("remembers a guest choice in a secure same-site cookie", async () => {
    const response = await PUT(request({ locale: "uk" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/iracing-locale=uk/);
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/);
    expect(response.headers.get("set-cookie")).toMatch(/SameSite=lax/i);
    expect(deps.updateUser).not.toHaveBeenCalled();
  });
  it("works without configured auth", async () => {
    deps.createClient.mockResolvedValue(null);
    expect((await PUT(request({ locale: "en" }))).status).toBe(200);
  });
  it.each([null, [], { locale: "ua" }, { locale: "fr" }, { locale: true }])("rejects invalid preferences %s", async body => {
    const response = await PUT(request(body));
    expect(response.status).toBe(400);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("only updates the verified current account", async () => {
    deps.getUser.mockResolvedValue({ data: { user: { id: "current" } }, error: null });
    expect((await PUT(request({ locale: "uk", userId: "other" }))).status).toBe(200);
    expect(deps.updateUser).toHaveBeenCalledWith({ data: { locale: "uk" } });
  });
  it("does not commit a cookie when the account save fails", async () => {
    deps.getUser.mockResolvedValue({ data: { user: { id: "current" } }, error: null });
    deps.updateUser.mockResolvedValue({ error: new Error("private") });
    const response = await PUT(request({ locale: "uk" }));
    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).not.toContain("private");
  });
  it("rejects a foreign origin before touching auth", async () => {
    expect((await PUT(request({ locale: "uk" }, "https://evil.com"))).status).toBe(403);
    expect(deps.createClient).not.toHaveBeenCalled();
  });
});
