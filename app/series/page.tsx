import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { SeriesPageClient } from "@/components/series/SeriesPageClient";
import { getLatestPreparedData } from "@/lib/data/preparedData";
import { createClient } from "@/lib/supabase/server";

export default async function SeriesPage() {
  const { season } = await getLatestPreparedData();
  const [authSlot, supabase] = await Promise.all([HeaderAuth(), createClient()]);
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const initialFavoriteSeries =
    user && supabase
      ? (
          await supabase
            .from("user_favorite_series")
            .select("series_name")
            .eq("user_id", user.id)
        ).data?.map((row) => row.series_name as string) ?? []
      : [];

  return (
    <SeriesPageClient
      season={season}
      authSlot={authSlot}
      utilitySlot={<FeedbackDialog />}
      isAuthenticated={Boolean(user)}
      initialFavoriteSeries={initialFavoriteSeries}
    />
  );
}
