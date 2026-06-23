import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { TracksPageClient } from "@/components/tracks/TracksPageClient";
import { getLatestPreparedData } from "@/lib/data/preparedData";
import { createClient } from "@/lib/supabase/server";

export default async function TracksPage() {
  const { season } = await getLatestPreparedData();
  const [authSlot, supabase] = await Promise.all([HeaderAuth(), createClient()]);
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const ownedTrackIds =
    user && supabase
      ? (
          await supabase
            .from("user_owned_tracks")
            .select("track_id")
            .eq("user_id", user.id)
        ).data?.map((row) => row.track_id as number) ?? []
      : [];

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
