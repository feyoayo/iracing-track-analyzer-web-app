import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { getPrisma } from "@/lib/db/client";

// Call only with an identity verified by server-side Supabase Auth.
export async function withDatabaseIdentity<T>(
  userId: string | null,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: { isolationLevel?: Prisma.TransactionIsolationLevel } = {},
): Promise<T> {
  return getPrisma().$transaction(async (tx) => {
    if (userId === null) {
      await tx.$executeRaw`SET LOCAL ROLE anon`;
    } else {
      await tx.$executeRaw`SET LOCAL ROLE authenticated`;
    }
    const claims = userId === null ? { role: "anon" } : { sub: userId, role: "authenticated" };
    await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub', ${userId ?? ""}, true), set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`;
    return operation(tx);
  }, options);
}
