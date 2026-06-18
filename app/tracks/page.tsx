import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { TracksPageClient } from "@/components/tracks/TracksPageClient";
import { getLatestPreparedData } from "@/lib/data/preparedData";

export default async function TracksPage() {
  const { season } = await getLatestPreparedData();
  const authSlot = await HeaderAuth();

  return (
    <TracksPageClient
      season={season}
      authSlot={authSlot}
      utilitySlot={<FeedbackDialog />}
    />
  );
}
