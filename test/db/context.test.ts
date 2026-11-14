// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ transaction: vi.fn(), execute: vi.fn(), query: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ getPrisma: () => ({ $transaction: db.transaction }) }));
import { withDatabaseIdentity } from "@/lib/db/context";

beforeEach(() => {
  vi.resetAllMocks();
  db.transaction.mockImplementation(async (run) => run({ $executeRaw: db.execute, $queryRaw: db.query }));
});
describe("database identity", () => {
  it.each([ ["user-a", "authenticated"], [null, "anon"] ])("binds %s only inside the transaction", async (id, role) => {
    const result = await withDatabaseIdentity(id, async () => {
      expect(db.execute.mock.calls[0][0].join("")).toBe(`SET LOCAL ROLE ${role}`);
      const [strings, subject, claims] = db.query.mock.calls[0];
      expect(strings.join("")).not.toContain("user-a");
      expect(subject).toBe(id ?? "");
      expect(JSON.parse(claims)).toEqual(id ? { sub: id, role } : { role });
      return 42;
    });
    expect(result).toBe(42);
  });
  it("does not run queries after a context setup failure", async () => {
    db.execute.mockRejectedValue(new Error("cannot assume role"));
    const operation = vi.fn();
    await expect(withDatabaseIdentity("a", operation)).rejects.toThrow("cannot assume role");
    expect(operation).not.toHaveBeenCalled();
  });
  it("propagates operation failures for rollback", async () => {
    await expect(withDatabaseIdentity("a", async () => { throw new Error("write failed"); })).rejects.toThrow("write failed");
  });
});
