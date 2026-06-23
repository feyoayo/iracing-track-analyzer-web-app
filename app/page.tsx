import { AppClient } from "@/components/app/AppClient";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { getLatestPreparedData } from "@/lib/data/preparedData";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const { season } = await getLatestPreparedData();
  const [authSlot, supabase] = await Promise.all([HeaderAuth(), createClient()]);
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const [initialFavoriteSeries, ownedTrackIds] =
    user && supabase
      ? await Promise.all([
          supabase
            .from("user_favorite_series")
            .select("series_name")
            .eq("user_id", user.id)
            .then((result) => result.data?.map((row) => row.series_name as string) ?? []),
          supabase
            .from("user_owned_tracks")
            .select("track_id")
            .eq("user_id", user.id)
            .then((result) => result.data?.map((row) => row.track_id as number) ?? []),
        ])
      : [[], []];

  return (
    <AppClient
      season={season}
      authSlot={authSlot}
      utilitySlot={<FeedbackDialog />}
      initialFavoriteSeries={initialFavoriteSeries}
      ownedTrackIds={ownedTrackIds}
      isAuthenticated={Boolean(user)}
    />
  );
}
