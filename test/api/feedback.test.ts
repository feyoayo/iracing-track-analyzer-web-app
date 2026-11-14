// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const deps = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: deps.createClient }));
vi.mock("@/lib/supabase/env", () => ({ getSupabaseEnv: () => ({ url: "http://localhost", publishableKey: "test" }) }));
vi.mock("@/lib/db/feedback", () => ({ saveFeedback: deps.save }));
import { POST } from "@/app/api/feedback/route";
const request = (body: unknown) => new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  deps.createClient.mockResolvedValue({ auth: { getUser: deps.getUser } });
  deps.getUser.mockResolvedValue({ data: { user: null }, error: null });
});
it.each([null, { id: "verified-user" }])("saves anonymous or verified feedback %s", async (user) => {
  deps.getUser.mockResolvedValue({ data: { user }, error: null });
  const response = await POST(request({ message: "  Useful feedback  ", name: " ", pagePath: " /tracks ", user_id: "attacker" }));
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true });
  expect(deps.save).toHaveBeenCalledWith({ userId: user?.id ?? null, name: null, message: "Useful feedback", pagePath: "/tracks" });
});
it.each([[4, 400], [5, 200], [1000, 200], [1001, 400]])("validates message length %i", async (length, status) => {
  expect((await POST(request({ message: "a".repeat(length) }))).status).toBe(status);
});
it.each([[120, 200], [121, 400]])("validates name length %i", async (length, status) => {
  expect((await POST(request({ message: "Valid message", name: "a".repeat(length) }))).status).toBe(status);
});
it.each([null, [], "bad"])("rejects nonobject JSON %s", async (body) => { expect((await POST(request(body))).status).toBe(400); });
it("rejects malformed JSON", async () => { expect((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400); });
it("hides database errors", async () => {
  deps.save.mockRejectedValue(new Error("postgres://secret"));
  const response = await POST(request({ message: "Valid message" }));
  expect(response.status).toBe(500); expect(await response.text()).not.toContain("secret");
});
