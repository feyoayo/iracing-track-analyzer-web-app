import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Environment = Record<string, string | undefined>;

export function postgresConnectionConfig(connectionString: string, env: Environment = process.env) {
  if (!env.DATABASE_SSL_CA_FILE) return { connectionString };
  const url = new URL(connectionString);
  // pg URL parameters override the explicit ssl object. Use only our verified
  // CA configuration when supplied, retaining unrelated connection options.
  for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "sslaccept", "uselibpqcompat"]) url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: { ca: readFileSync(resolve(env.DATABASE_SSL_CA_FILE), "utf8"), rejectUnauthorized: true },
  };
}

export function prismaMigrationUrl(connectionString: string | undefined, env: Environment = process.env): string | undefined {
  if (!connectionString || !env.DATABASE_SSL_CA_FILE) return connectionString;
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("sslaccept", "strict");
  url.searchParams.set("sslcert", resolve(env.DATABASE_SSL_CA_FILE));
  url.searchParams.set("sslrootcert", resolve(env.DATABASE_SSL_CA_FILE));
  return url.toString();
}
