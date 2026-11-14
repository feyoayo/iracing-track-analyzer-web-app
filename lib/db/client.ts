import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const databaseGlobal = globalThis as unknown as { iracingPrisma?: PrismaClient };
let client: PrismaClient | undefined;

// Importing server pages must not open a connection or require database secrets.
export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Database is not configured.");
  if (client) return client;
  if (process.env.NODE_ENV === "development" && databaseGlobal.iracingPrisma) {
    return (client = databaseGlobal.iracingPrisma);
  }
  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  client = new PrismaClient({ adapter, transactionOptions: { maxWait: 5000, timeout: 10000 } });
  if (process.env.NODE_ENV === "development") databaseGlobal.iracingPrisma = client;
  return client;
}
