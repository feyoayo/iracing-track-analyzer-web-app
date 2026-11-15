import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import { getTestTargets } from "./targets";

export function prismaCommand(url: string, args: string[]) {
  try {
    return execFileSync("node_modules/.bin/prisma", args, {
      encoding: "utf8", timeout: 60000,
      env: { ...process.env, DIRECT_URL: url }, stdio: "pipe",
    });
  } catch {
    throw new Error(`Prisma integration command failed: ${args.slice(0, 2).join(" ")}. Inspect disposable database status.`);
  }
}

export default async function setup() {
  const targets = getTestTargets();
  // Check BOTH targets before writing to either. These must be fresh Supabase environments.
  for (const url of [targets.direct, targets.baseline]) {
    const db = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
    try {
      await db.connect();
      const { rows } = await db.query("SELECT to_regclass('auth.users') AS users, to_regclass('public.profiles') AS profiles, to_regclass('public.feedback') AS feedback, to_regclass('public.user_owned_tracks') AS tracks, to_regclass('public.user_favorite_series') AS favorites, to_regclass('public.seasons') AS seasons, to_regclass('public.series') AS series, to_regclass('public.series_weeks') AS weeks, to_regclass('public._prisma_migrations') AS history");
      if (!rows[0].users || Object.entries(rows[0]).some(([key, value]) => key !== "users" && value !== null)) {
        throw new Error("Integration targets must be fresh disposable Supabase databases with no application tables/history.");
      }
    } finally { await db.end(); }
  }
  // Ensure the runtime URL connects to the SAME database as TEST_DIRECT_URL.
  const direct = new Client({ connectionString: targets.direct, connectionTimeoutMillis: 5000 });
  const runtime = new Client({ connectionString: targets.runtime, connectionTimeoutMillis: 5000 });
  const lockKey = Math.floor(Math.random() * 1_000_000_000);
  try {
    await direct.connect(); await runtime.connect();
    await direct.query("SELECT pg_advisory_lock($1)", [lockKey]);
    await runtime.query("BEGIN");
    const { rows } = await runtime.query("SELECT pg_try_advisory_xact_lock($1) AS acquired", [lockKey]);
    if (rows[0].acquired) throw new Error("TEST_DATABASE_URL must connect to the same database as TEST_DIRECT_URL.");
  } finally {
    await runtime.end(); await direct.end();
  }
  prismaCommand(targets.direct, ["migrate", "deploy"]);
  const legacy = new Client({ connectionString: targets.baseline, connectionTimeoutMillis: 5000 });
  try {
    await legacy.connect();
    for (const file of ["20260618_create_profiles.sql", "20260618_create_feedback.sql", "20260623_create_user_owned_tracks.sql", "20260623_create_user_favorite_series.sql"]) {
      await legacy.query(readFileSync(`supabase/migrations/${file}`, "utf8"));
    }
  } finally { await legacy.end(); }
}
