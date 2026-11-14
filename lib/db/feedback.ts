import "server-only";

import { withDatabaseIdentity } from "@/lib/db/context";

type FeedbackInput = {
  userId: string | null;
  name: string | null;
  message: string;
  pagePath: string | null;
};

export async function saveFeedback(input: FeedbackInput): Promise<void> {
  await withDatabaseIdentity(input.userId, async (tx) => {
    // createMany avoids RETURNING: feedback roles have INSERT but no read policy.
    await tx.feedback.createMany({ data: [{ ...input, name: input.name?.trim() || null }] });
  });
}
