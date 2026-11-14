import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { Client } from "pg";

export type CatalogRow = { section: string; key: string; definition: unknown };

function databaseIdentity(value: string): string {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("A PostgreSQL URL is required.");
  return `${url.hostname}:${url.port || "5432"}${url.pathname}`;
}

export function assertDifferentDatabases(a: string, b: string): void {
  if (databaseIdentity(a) === databaseIdentity(b)) throw new Error("Connections must target different databases.");
}

export function compareSnapshots(actual: CatalogRow[], reference: CatalogRow[]): string[] {
  const left = new Map(actual.map((row) => [`${row.section}:${row.key}`, row.definition]));
  const right = new Map(reference.map((row) => [`${row.section}:${row.key}`, row.definition]));
  return [...new Set([...left.keys(), ...right.keys()])].sort().flatMap((key) => {
    if (!left.has(key)) return [`${key}: missing`];
    if (!right.has(key)) return [`${key}: unexpected`];
    return isDeepStrictEqual(left.get(key), right.get(key)) ? [] : [`${key}: differs`];
  });
}

export async function readSnapshot(connectionString: string): Promise<CatalogRow[]> {
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    await client.query("SET LOCAL search_path = public, pg_catalog");
    await client.query("SET LOCAL statement_timeout = '10s'");
    return (await client.query<CatalogRow>(readFileSync(new URL("./expected-schema.sql", import.meta.url), "utf8"))).rows;
  } finally {
    await client.end();
  }
}

export async function verifyBaseline(target: string, reference: string): Promise<string[]> {
  assertDifferentDatabases(target, reference);
  const [actual, expected] = await Promise.all([readSnapshot(target), readSnapshot(reference)]);
  // Refuse an empty/missing reference rather than blessing two empty databases.
  for (const table of ["profiles", "feedback", "user_owned_tracks", "user_favorite_series"]) {
    if (!expected.some((row) => row.section === "table" && row.key === table)) throw new Error("Reference baseline is incomplete.");
  }
  return compareSnapshots(actual, expected);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  config({ path: ".env.local", quiet: true });
  config({ path: ".env", quiet: true });
  const target = process.env.DIRECT_URL;
  const reference = process.env.BASELINE_REFERENCE_URL;
  if (!target || !reference) {
    console.error("Set DIRECT_URL and BASELINE_REFERENCE_URL (a freshly migrated disposable reference).");
    process.exitCode = 1;
  } else {
    verifyBaseline(target, reference).then((differences) => {
      if (differences.length) {
        console.error("Baseline mismatch; do not resolve 0_init:\n" + differences.join("\n"));
        process.exitCode = 1;
      } else console.log("Application catalog matches reference. No migration history was changed.");
    }).catch(() => {
      console.error("Could not verify baseline. Check connections, permissions and reference setup.");
      process.exitCode = 1;
    });
  }
}
