// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ user: vi.fn(), cookie: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getCurrentUser: deps.user }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: deps.cookie }) }));
import { getRequestLocale } from "@/lib/i18n/server";
beforeEach(() => { vi.resetAllMocks(); deps.user.mockResolvedValue(null); deps.cookie.mockReturnValue(undefined); });
describe("server initial locale", () => {
  it("renders English on the first visit", async () => { expect(await getRequestLocale()).toBe("en"); });
  it("restores a guest cookie on a new request", async () => {
    deps.cookie.mockReturnValue({ value: "uk" });
    expect(await getRequestLocale()).toBe("uk");
    expect(deps.cookie).toHaveBeenCalledWith("iracing-locale");
  });
  it("restores the account on another device even with a conflicting browser choice", async () => {
    deps.user.mockResolvedValue({ user_metadata: { locale: "uk" } });
    deps.cookie.mockReturnValue({ value: "en" });
    expect(await getRequestLocale()).toBe("uk");
  });
});
