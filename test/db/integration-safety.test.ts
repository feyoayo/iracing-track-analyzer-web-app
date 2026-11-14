// @vitest-environment node
import { expect, it } from "vitest";
import { getTestTargets } from "@/test/integration/targets";
it("refuses missing acknowledgement before any connection", () => {
  expect(() => getTestTargets({})).toThrow("disposable");
});
it("refuses live runtime or migration databases", () => {
  expect(() => getTestTargets({ TEST_DATABASE_ACK: "disposable", TEST_DATABASE_URL: "postgres://u@localhost/a", TEST_DIRECT_URL: "postgres://u@localhost/a", TEST_BASELINE_DIRECT_URL: "postgres://u@localhost/b", DATABASE_URL: "postgres://other@localhost/a" })).toThrow("live");
});
it("accepts separate explicitly disposable environments", () => {
  expect(getTestTargets({ TEST_DATABASE_ACK: "disposable", TEST_DATABASE_URL: "postgres://u@localhost/a", TEST_DIRECT_URL: "postgres://u@localhost/a", TEST_BASELINE_DIRECT_URL: "postgres://u@localhost/b" }).baseline).toBe("postgres://u@localhost/b");
});

it("refuses a pooled alias of a configured live direct URL", () => {
  expect(() => getTestTargets({
    TEST_DATABASE_ACK: "disposable",
    TEST_DATABASE_URL: "postgres://app.aaaaaaaaaaaaaaaaaaaa@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
    TEST_DIRECT_URL: "postgres://postgres@db.aaaaaaaaaaaaaaaaaaaa.supabase.co/postgres",
    TEST_BASELINE_DIRECT_URL: "postgres://postgres@db.bbbbbbbbbbbbbbbbbbbb.supabase.co/postgres",
    DATABASE_URL: "postgres://postgres.aaaaaaaaaaaaaaaaaaaa@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
  })).toThrow("live");
});
