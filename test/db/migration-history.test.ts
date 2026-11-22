// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";

it("protects existing Prisma metadata and tolerates shadow replay without a history table", async () => {
  const db = await PGlite.create();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
    const directory = readdirSync("prisma/migrations").find(name => name.endsWith("_protect_prisma_history"));
    const migration = directory ? readFileSync(`prisma/migrations/${directory}/migration.sql`, "utf8") : "SELECT 1";
    await db.exec(migration);
    await db.exec("CREATE TABLE public._prisma_migrations(id text); GRANT ALL ON public._prisma_migrations TO anon, authenticated;");
    await db.exec(migration);
    expect((await db.query("SELECT relrowsecurity AS rls FROM pg_class WHERE oid='public._prisma_migrations'::regclass")).rows).toEqual([{ rls: true }]);
    for (const role of ["anon", "authenticated"]) {
      expect((await db.query("SELECT has_table_privilege($1, 'public._prisma_migrations', 'SELECT') AS readable, has_table_privilege($1, 'public._prisma_migrations', 'INSERT') AS writable", [role])).rows).toEqual([{ readable: false, writable: false }]);
    }
  } finally { await db.close(); }
}, 30000);
