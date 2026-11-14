import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { getTestTargets } from "./targets";

const boundary = vi.hoisted(() => ({ client: null as PrismaClient | null }));
vi.mock("@/lib/db/client", () => ({ getPrisma: () => {
  if (!boundary.client) throw new Error("Test client not initialized");
  return boundary.client;
} }));
import { withDatabaseIdentity } from "../../lib/db/context";
import { getOwnedTrackIds, getFavoriteSeriesNames, setTrackOwned, setSeriesFavorite } from "../../lib/db/preferences";
import { saveFeedback } from "../../lib/db/feedback";

const targets = getTestTargets();
const admin = new Client({ connectionString: targets.direct, connectionTimeoutMillis: 5000 });
const ids: string[] = [];
const marker = `Prisma integration ${randomUUID()}`;
let auth: ReturnType<typeof createClient>;
beforeAll(async () => {
  const url = process.env.TEST_SUPABASE_URL;
  const key = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set test-only Supabase Auth URL and service-role key for the fresh runtime project.");
  auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  await admin.connect();
  boundary.client = new PrismaClient({ adapter: new PrismaPg({ connectionString: targets.runtime, max: 1, connectionTimeoutMillis: 5000 }), transactionOptions: { maxWait: 10000, timeout: 10000 } });
  for (let i = 0; i < 2; i++) {
    const { data, error } = await auth.auth.admin.createUser({ email: `prisma-${randomUUID()}@example.com`, email_confirm: true, user_metadata: { full_name: marker } });
    if (error || !data.user) throw new Error("Could not create test Auth user.");
    ids.push(data.user.id);
    // Confirm the Auth endpoint belongs to the database checked by the safety guard.
    expect((await admin.query("SELECT id FROM auth.users WHERE id=$1", [data.user.id])).rowCount).toBe(1);
  }
});
afterAll(async () => {
  try {
    await admin.query("DELETE FROM public.feedback WHERE message=$1", [marker]);
    for (const id of ids) {
      const { error } = await auth.auth.admin.deleteUser(id);
      if (error) throw new Error("Could not remove a test Auth user.");
    }
  } finally { await boundary.client?.$disconnect(); await admin.end(); }
});
it("keeps preferences isolated and toggles idempotent without UPDATE policies", async () => {
  const [a, b] = ids;
  await setTrackOwned(a, 12, true); await setTrackOwned(a, 12, true);
  await setTrackOwned(b, 89, true);
  expect(await getOwnedTrackIds(a)).toEqual([12]); expect(await getOwnedTrackIds(b)).toEqual([89]);
  await setSeriesFavorite(a, "GT3", true); await setSeriesFavorite(a, "GT3", true);
  expect(await getFavoriteSeriesNames(a)).toEqual(["GT3"]); expect(await getFavoriteSeriesNames(b)).toEqual([]);
  await setSeriesFavorite(a, "GT3", false); await setSeriesFavorite(a, "GT3", false);
  expect(await getFavoriteSeriesNames(a)).toEqual([]);
  await setTrackOwned(a, 12, false); await setTrackOwned(a, 12, false);
  expect(await getOwnedTrackIds(a)).toEqual([]);
});
it("enforces RLS even when a query omits a user filter", async () => {
  const [a, b] = ids;
  await setTrackOwned(a, 12, true); await setTrackOwned(b, 89, true);
  expect(await withDatabaseIdentity(a, (tx) => tx.userOwnedTrack.findMany({ select: { userId: true } }))).toEqual([{ userId: a }]);
  await expect(withDatabaseIdentity(a, (tx) => tx.userOwnedTrack.createMany({ data: [{ userId: b, trackId: 13 }] }))).rejects.toThrow();
});
it("allows feedback insertion when SELECT is explicitly revoked", async () => {
  const { rows: grants } = await admin.query("SELECT grantee, is_grantable FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='feedback' AND privilege_type='SELECT' AND grantee IN ('anon', 'authenticated', 'PUBLIC')");
  try {
    await admin.query("REVOKE SELECT ON public.feedback FROM anon, authenticated, PUBLIC");
    await saveFeedback({ userId: null, name: " ", message: marker, pagePath: "/tracks" });
    await saveFeedback({ userId: ids[0], name: null, message: marker, pagePath: "/" });
    const rows = (await admin.query("SELECT user_id, name FROM public.feedback WHERE message=$1", [marker])).rows;
    expect(rows).toEqual(expect.arrayContaining([{ user_id: null, name: null }, { user_id: ids[0], name: null }]));
    await expect(withDatabaseIdentity(null, (tx) => tx.feedback.findMany())).rejects.toThrow();
    await expect(withDatabaseIdentity(ids[0], (tx) => tx.feedback.findMany())).rejects.toThrow();
  } finally {
    for (const grant of grants) {
      if (!["anon", "authenticated", "PUBLIC"].includes(grant.grantee)) throw new Error("Unexpected role");
      await admin.query(`GRANT SELECT ON public.feedback TO ${grant.grantee}${grant.is_grantable === "YES" ? " WITH GRANT OPTION" : ""}`);
    }
  }
});

it("resets role/subject after success and rollback on a single reused connection", async () => {
  const read = (id: string | null) => withDatabaseIdentity(id, (tx) => tx.$queryRaw<Array<{ role: string; subject: string }>>`SELECT current_user AS role, current_setting('request.jwt.claim.sub', true) AS subject`);
  await expect(withDatabaseIdentity(ids[0], async () => { throw new Error("rollback fixture"); })).rejects.toThrow("rollback fixture");
  expect(await Promise.all([read(ids[0]), read(ids[1]), read(null)])).toEqual([
    [{ role: "authenticated", subject: ids[0] }], [{ role: "authenticated", subject: ids[1] }], [{ role: "anon", subject: "" }],
  ]);
  const [outside] = await boundary.client!.$queryRaw<Array<{ role: string; subject: string | null }>>`SELECT current_user AS role, current_setting('request.jwt.claim.sub', true) AS subject`;
  expect(outside.role).not.toBe("authenticated"); expect(outside.role).not.toBe("anon"); expect(outside.subject || "").toBe("");
});
it("preserves profile sync, timestamp updates and deletion actions", async () => {
  const id = ids[0];
  expect((await admin.query("SELECT full_name FROM public.profiles WHERE id=$1", [id])).rows[0].full_name).toBe(marker);
  const before = (await admin.query("SELECT updated_at FROM public.profiles WHERE id=$1", [id])).rows[0].updated_at;
  await withDatabaseIdentity(id, (tx) => tx.profile.update({ where: { id }, data: { fullName: "Updated" } }));
  const after = (await admin.query("SELECT updated_at FROM public.profiles WHERE id=$1", [id])).rows[0].updated_at;
  expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime());
  const { error } = await auth.auth.admin.deleteUser(id); if (error) throw error;
  ids.shift();
  expect((await admin.query("SELECT id FROM public.profiles WHERE id=$1", [id])).rowCount).toBe(0);
  expect((await admin.query("SELECT track_id FROM public.user_owned_tracks WHERE user_id=$1", [id])).rowCount).toBe(0);
  expect((await admin.query("SELECT id FROM public.feedback WHERE user_id=$1", [id])).rowCount).toBe(0);
  expect((await admin.query("SELECT count(*)::int AS count FROM public.feedback WHERE message=$1 AND user_id IS NULL", [marker])).rows[0].count).toBe(2);
});
