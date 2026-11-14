import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validateMigrationName(name: string): string {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error("Use a lowercase migration name with underscores.");
  return name;
}

export function validateMigrationSql(sql: string): void {
  // Generated Prisma DDL is regular SQL. This is a guard, not a SQL parser:
  // custom SQL still requires review. REFERENCES auth.users is intentionally allowed.
  if (/\b(?:CREATE|ALTER|DROP)\s+(?:(?:TABLE|TYPE|VIEW|SEQUENCE|FUNCTION)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:"auth"|auth)\s*\.|SCHEMA\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:"auth"|auth)(?=\s|;|$))/i.test(sql)) {
    throw new Error("Generated migration would modify Supabase-owned auth objects. Review configuration before continuing.");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  config({ path: ".env.local", quiet: true }); config({ path: ".env", quiet: true });
  try {
    const name = validateMigrationName(process.argv[2] ?? "");
    if (!process.env.SHADOW_DATABASE_URL) throw new Error("Set SHADOW_DATABASE_URL to a disposable shadow database.");
    // Compare only migration history and our model: never diff the entire live auth schema.
    const sql = execFileSync("node_modules/.bin/prisma", ["migrate", "diff", "--from-migrations", "prisma/migrations", "--to-schema", "prisma/schema.prisma", "--script"], { encoding: "utf8", timeout: 60000, stdio: "pipe" });
    validateMigrationSql(sql);
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const directory = `prisma/migrations/${stamp}_${name}`;
    mkdirSync(directory);
    writeFileSync(`${directory}/migration.sql`, sql, { flag: "wx" });
    console.log(`Created ${directory}/migration.sql. Review custom SQL and grants before explicit deployment.`);
  } catch (error) {
    // Child process errors can contain connection credentials; do not print them.
    console.error(error instanceof Error && !("status" in error) ? error.message : "Migration generation failed. Check the disposable shadow database and configuration.");
    process.exitCode = 1;
  }
}
