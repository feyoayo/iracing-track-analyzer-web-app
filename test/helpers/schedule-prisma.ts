import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { createScheduleDatabase } from "./schedule-database";

export async function createSchedulePrisma() {
  const db = await createScheduleDatabase();
  const server = new PGLiteSocketServer({ db, port: 0, host: "127.0.0.1" });
  // The socket package swallows listen errors; surface sandbox failures promptly.
  await Promise.race([
    server.start(),
    new Promise<never>((_resolve, reject) => {
      server.addEventListener("error", event => reject((event as CustomEvent).detail), { once: true });
    }),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: `postgresql://postgres:postgres@${server.getServerConn()}/postgres`, max: 1, connectionTimeoutMillis: 5000 }),
    transactionOptions: { timeout: 30000 },
  });
  return { db, prisma, async close() {
    await prisma.$disconnect(); await server.stop(); await db.close();
  } };
}
