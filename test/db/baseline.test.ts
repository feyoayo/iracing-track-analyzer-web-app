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
  it("distinguishes Supabase projects on a shared pooler", () => {
    expect(() => assertDifferentDatabases("postgresql://postgres.aaaaaaaaaaaaaaaaaaaa:one@aws-0-eu-west-1.pooler.supabase.com:5432/postgres", "postgresql://postgres.bbbbbbbbbbbbbbbbbbbb:two@aws-0-eu-west-1.pooler.supabase.com:5432/postgres")).not.toThrow();
  });
  it("recognizes the same Supabase project across roles, direct and pooled URLs", () => {
    expect(() => assertDifferentDatabases("postgresql://postgres@db.aaaaaaaaaaaaaaaaaaaa.supabase.co:5432/postgres", "postgresql://app_runtime.aaaaaaaaaaaaaaaaaaaa@aws-0-eu-west-1.pooler.supabase.com:6543/postgres")).toThrow("different databases");
  });

  it("rejects incomplete security-definer ownership context even when both snapshots omit it", () => {
    const incomplete = [{ section: "function", key: "handle_new_user()", definition: { securityDefiner: true, definition: "function body" } }];
    expect(compareSnapshots(incomplete, incomplete)).toContain("function:handle_new_user(): ownership context missing");
  });
  it("detects changed function ownership and owner privilege context", () => {
    const reference = [{ section: "function", key: "handle_new_user()", definition: { securityDefiner: true, owner: "postgres", ownerContext: { bypassRls: true } } }];
    const changed = [{ section: "function", key: "handle_new_user()", definition: { securityDefiner: true, owner: "restricted", ownerContext: { bypassRls: false } } }];
    expect(compareSnapshots(changed, reference)).toEqual(["function:handle_new_user(): differs"]);
  });

});
