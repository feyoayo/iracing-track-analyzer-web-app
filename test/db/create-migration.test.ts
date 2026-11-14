// @vitest-environment node
import { expect, it } from "vitest";
import { validateMigrationSql, validateMigrationName } from "@/scripts/db/create-migration";
it.each([
  'DROP TABLE "auth"."sessions";', 'ALTER TABLE auth.users DROP COLUMN email;',
  'CREATE TABLE auth.users (id uuid);', 'DROP SCHEMA "auth" CASCADE;',
  'ALTER TYPE "auth"."aal_level" ADD VALUE \'x\';',
])("rejects generated DDL on Supabase auth objects: %s", (sql) => {
  expect(() => validateMigrationSql(sql)).toThrow("Supabase-owned");
});
it("permits application foreign keys referencing external Auth users", () => {
  expect(() => validateMigrationSql('ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES "auth"."users"(id);')).not.toThrow();
});
it.each(["../escape", "", "bad name"])("rejects unsafe migration name %s", (name) => {
  expect(() => validateMigrationName(name)).toThrow("lowercase");
});
it("accepts an ordinary migration name", () => { expect(validateMigrationName("add_preferences")).toBe("add_preferences"); });
