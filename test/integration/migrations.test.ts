import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Client } from "pg";
import { verifyBaseline } from "../../scripts/db/verify-baseline";
import { getTestTargets } from "./targets";
import { prismaCommand } from "./setup";

const targets = getTestTargets();
const legacy = new Client({ connectionString: targets.baseline, connectionTimeoutMillis: 5000 });
const userId = randomUUID();
beforeAll(async () => {
  await legacy.connect();
  await legacy.query("INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES ($1, $2, $3)", [userId, `${userId}@example.com`, { full_name: "Baseline fixture" }]);
  await legacy.query("INSERT INTO public.user_owned_tracks(user_id, track_id) VALUES ($1, 12)", [userId]);
});
afterAll(async () => {
  try { await legacy.query("DELETE FROM auth.users WHERE id = $1", [userId]); }
  finally { await legacy.end(); }
});
it("adopts equivalent legacy tables without recreating data", async () => {
  expect(await verifyBaseline(targets.baseline, targets.direct)).toEqual([]);
  prismaCommand(targets.baseline, ["migrate", "resolve", "--applied", "0_init"]);
  prismaCommand(targets.baseline, ["migrate", "deploy"]);
  expect((await legacy.query("SELECT track_id FROM public.user_owned_tracks WHERE user_id = $1", [userId])).rows).toEqual([{ track_id: 12 }]);
  expect((await legacy.query("SELECT migration_name FROM public._prisma_migrations WHERE finished_at IS NOT NULL")).rows).toEqual([{ migration_name: "0_init" }]);
  prismaCommand(targets.baseline, ["migrate", "status"]);
});
it("detects a weakened policy and restores it without touching history", async () => {
  await legacy.query("BEGIN");
  try {
    await legacy.query("ALTER POLICY user_owned_tracks_select_own ON public.user_owned_tracks USING (true)");
    // A separate read-only verifier cannot see uncommitted changes; commit the fixture mutation.
    await legacy.query("COMMIT");
    expect(await verifyBaseline(targets.baseline, targets.direct)).toContain("policy:user_owned_tracks.user_owned_tracks_select_own: differs");
  } finally {
    await legacy.query("ALTER POLICY user_owned_tracks_select_own ON public.user_owned_tracks USING (auth.uid() = user_id)");
  }
});
it("detects a column change", async () => {
  await legacy.query("ALTER TABLE public.feedback ADD COLUMN prisma_test_extra text");
  try { expect(await verifyBaseline(targets.baseline, targets.direct)).toContain("column:feedback.prisma_test_extra: unexpected"); }
  finally { await legacy.query("ALTER TABLE public.feedback DROP COLUMN prisma_test_extra"); }
});
it("preserves modeled schema and auth foreign keys in a migration diff", () => {
  const sql = prismaCommand(targets.direct, ["migrate", "diff", "--from-migrations", "prisma/migrations", "--to-schema", "prisma/schema.prisma", "--script", "--exit-code"]);
  expect(sql).not.toMatch(/(?:CREATE|ALTER|DROP)\s+TABLE/i);
});

it("detects security-definer owner drift even when the function body stays unchanged", async () => {
  const { rows: [original] } = await legacy.query("SELECT pg_get_userbyid(proowner) AS owner FROM pg_proc WHERE oid='public.handle_new_user()'::regprocedure");
  const { rows: [privilege] } = await legacy.query("SELECT has_schema_privilege('authenticated', 'public', 'CREATE') AS allowed");
  try {
    if (!privilege.allowed) await legacy.query("GRANT CREATE ON SCHEMA public TO authenticated");
    await legacy.query("ALTER FUNCTION public.handle_new_user() OWNER TO authenticated");
    expect(await verifyBaseline(targets.baseline, targets.direct)).toContain("function:handle_new_user(): differs");
  } finally {
    const quotedOwner = '"' + original.owner.replace(/"/g, '""') + '"';
    await legacy.query(`ALTER FUNCTION public.handle_new_user() OWNER TO ${quotedOwner}`);
    if (!privilege.allowed) await legacy.query("REVOKE CREATE ON SCHEMA public FROM authenticated");
  }
});
