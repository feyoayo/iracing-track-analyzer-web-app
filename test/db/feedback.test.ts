// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const boundary = vi.hoisted(() => ({ identity: vi.fn(), insert: vi.fn() }));
vi.mock("@/lib/db/context", () => ({ withDatabaseIdentity: boundary.identity }));
import { saveFeedback } from "@/lib/db/feedback";
beforeEach(() => { vi.resetAllMocks(); boundary.identity.mockImplementation(async (_id, run) => run({ feedback: { createMany: boundary.insert } })); });
it.each([null, "user-a"])("saves feedback with identity %s without RETURNING", async (userId) => {
  await saveFeedback({ userId, name: "  ", message: "Useful feedback", pagePath: "/tracks" });
  expect(boundary.identity).toHaveBeenCalledWith(userId, expect.any(Function));
  expect(boundary.insert).toHaveBeenCalledWith({ data: [{ userId, name: null, message: "Useful feedback", pagePath: "/tracks" }] });
});
it("keeps a provided name", async () => {
  await saveFeedback({ userId: null, name: "Andrew", message: "Useful feedback", pagePath: null });
  expect(boundary.insert).toHaveBeenCalledWith({ data: [{ userId: null, name: "Andrew", message: "Useful feedback", pagePath: null }] });
});
it("propagates a write failure", async () => {
  boundary.insert.mockRejectedValue(new Error("db failed"));
  await expect(saveFeedback({ userId: null, name: null, message: "Useful feedback", pagePath: null })).rejects.toThrow("db failed");
});
