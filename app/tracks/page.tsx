import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { TracksPageClient } from "@/components/tracks/TracksPageClient";
import { getLatestPreparedData } from "@/lib/data/preparedData";
import { getOwnedTrackIds } from "@/lib/db/preferences";
import { createClient } from "@/lib/supabase/server";

export default async function TracksPage() {
  const { season } = await getLatestPreparedData();
  const [authSlot, supabase] = await Promise.all([HeaderAuth(), createClient()]);
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const ownedTrackIds = user ? await getOwnedTrackIds(user.id).catch(() => []) : [];

  return (
    <TracksPageClient
      season={season}
      authSlot={authSlot}
      utilitySlot={<FeedbackDialog />}
      isAuthenticated={Boolean(user)}
      initialOwnedTrackIds={ownedTrackIds}
    />
  );
}
