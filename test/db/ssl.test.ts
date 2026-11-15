// @vitest-environment node
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, it } from "vitest";
import { postgresConnectionConfig, prismaMigrationUrl } from "@/lib/db/ssl";

const directory = mkdtempSync(join(tmpdir(), "iracing-ca-"));
const certificate = join(directory, "root.crt");
writeFileSync(certificate, "test-root-certificate");
afterAll(() => rmSync(directory, { recursive: true, force: true }));
it("leaves unconfigured local database connections unchanged", () => {
  const url = "postgresql://test:secret@localhost/test";
  expect(postgresConnectionConfig(url, {})).toEqual({ connectionString: url });
  expect(prismaMigrationUrl(undefined, {})).toBeUndefined();
  expect(prismaMigrationUrl(url, {})).toBe(url);
});
it("uses the supplied root certificate and prevents URL options from disabling verification", () => {
  const result = postgresConnectionConfig("postgresql://test:secret@localhost/test?sslmode=disable&pgbouncer=true", { DATABASE_SSL_CA_FILE: certificate });
  expect(new URL(result.connectionString).searchParams.has("sslmode")).toBe(false);
  expect(new URL(result.connectionString).searchParams.get("pgbouncer")).toBe("true");
  expect(result.ssl).toEqual({ ca: "test-root-certificate", rejectUnauthorized: true });
});
it("configures the native migration engine with its root-certificate parameter", () => {
  const url = new URL(prismaMigrationUrl("postgresql://test:secret@localhost/test", { DATABASE_SSL_CA_FILE: certificate })!);
  expect(url.searchParams.get("sslmode")).toBe("require");
  expect(url.searchParams.get("sslaccept")).toBe("strict");
  expect(url.searchParams.get("sslcert")).toBe(certificate);
  expect(url.searchParams.get("sslrootcert")).toBe(certificate);
});
it("fails closed if the configured certificate file is missing", () => {
  expect(() => postgresConnectionConfig("postgresql://test@localhost/test", { DATABASE_SSL_CA_FILE: join(directory, "missing.crt") })).toThrow();
});
