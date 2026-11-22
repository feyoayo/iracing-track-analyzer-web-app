// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ createClient: vi.fn(), exchange: vi.fn(), user: vi.fn(), update: vi.fn(), cookie: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: deps.createClient }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: deps.cookie }) }));
import { GET } from "@/app/auth/callback/route";
beforeEach(() => {
  vi.resetAllMocks();
  deps.createClient.mockResolvedValue({ auth: { exchangeCodeForSession: deps.exchange, getUser: deps.user, updateUser: deps.update } });
  deps.exchange.mockResolvedValue({ error: null });
  deps.user.mockResolvedValue({ data: { user: { id: "verified", user_metadata: {} } }, error: null });
  deps.update.mockResolvedValue({ error: null });
  deps.cookie.mockReturnValue({ value: "uk" });
});
const request = () => new Request("https://example.com/auth/callback?code=valid&next=/tracks");
describe("first login locale import", () => {
  it("imports the guest preference when the account has no language", async () => {
    const response = await GET(request());
    expect(deps.update).toHaveBeenCalledWith({ data: { locale: "uk" } });
    expect(response.headers.get("location")).toBe("https://example.com/tracks");
  });
  it("preserves a saved account choice", async () => {
    deps.user.mockResolvedValue({ data: { user: { user_metadata: { locale: "en" } } } });
    await GET(request());
    expect(deps.update).not.toHaveBeenCalled();
  });
  it.each([undefined, { value: "ua" }])("does not import missing or invalid cookies", async cookie => {
    deps.cookie.mockReturnValue(cookie);
    await GET(request());
    expect(deps.update).not.toHaveBeenCalled();
  });
  it("does not access preferences when authentication fails", async () => {
    deps.exchange.mockResolvedValue({ error: new Error("invalid code") });
    const response = await GET(request());
    expect(response.headers.get("location")).toBe("https://example.com/auth/error");
    expect(deps.user).not.toHaveBeenCalled();
    expect(deps.update).not.toHaveBeenCalled();
  });
});
