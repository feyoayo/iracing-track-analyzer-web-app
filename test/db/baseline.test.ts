// @vitest-environment node
import { describe, expect, it } from "vitest";
import { compareSnapshots, assertDifferentDatabases } from "@/scripts/db/verify-baseline";

describe("baseline equivalence", () => {
  it("accepts equal catalogs regardless of query row order", () => {
    expect(compareSnapshots([{ section: "table", key: "a", definition: { rls: true } }], [{ section: "table", key: "a", definition: { rls: true } }])).toEqual([]);
  });
  it("rejects a changed policy, missing constraint or extra column", () => {
    const actual = [{ section: "policy", key: "owned", definition: { using: "true" } }, { section: "column", key: "extra", definition: {} }];
    const reference = [{ section: "policy", key: "owned", definition: { using: "auth.uid() = user_id" } }, { section: "constraint", key: "fk", definition: {} }];
    expect(compareSnapshots(actual, reference)).toEqual(["column:extra: unexpected", "constraint:fk: missing", "policy:owned: differs"]);
  });
  it("does not compare database credentials when guarding distinct targets", () => {
    expect(() => assertDifferentDatabases("postgres://a:one@localhost/db", "postgresql://b:two@localhost:5432/db")).toThrow("different databases");
  });
  it("accepts distinct databases and rejects non-PostgreSQL URLs", () => {
    expect(() => assertDifferentDatabases("postgres://a@localhost/a", "postgres://a@localhost/b")).not.toThrow();
    expect(() => assertDifferentDatabases("https://example.com", "postgres://a@localhost/b")).toThrow("PostgreSQL");
  });
});
