import { assertDifferentDatabases } from "../../scripts/db/verify-baseline";

export function getTestTargets(env: Record<string, string | undefined> = process.env) {
  if (env.TEST_DATABASE_ACK !== "disposable") throw new Error("Set TEST_DATABASE_ACK=disposable for empty disposable databases only.");
  const runtime = env.TEST_DATABASE_URL;
  const direct = env.TEST_DIRECT_URL;
  const baseline = env.TEST_BASELINE_DIRECT_URL;
  if (!runtime || !direct || !baseline) throw new Error("Set all three disposable TEST_* database URLs.");
  assertDifferentDatabases(direct, baseline);
  for (const candidate of [runtime, direct, baseline]) {
    for (const live of [env.DATABASE_URL, env.DIRECT_URL]) {
      if (!live) continue;
      try { assertDifferentDatabases(candidate, live); }
      catch { throw new Error("Test targets must differ from configured live databases."); }
    }
  }
  return { runtime, direct, baseline };
}
