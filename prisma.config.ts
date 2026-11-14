import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { defineConfig } from "prisma/config";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  experimental: { externalTables: true },
  tables: { external: ["auth.users"] },
  migrations: {
    path: "prisma/migrations",
    initShadowDb: readFileSync("prisma/shadow-init.sql", "utf8"),
  },
  // Undefined permits offline generate/validate. Database commands require DIRECT_URL.
  datasource: {
    url: process.env.DIRECT_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
