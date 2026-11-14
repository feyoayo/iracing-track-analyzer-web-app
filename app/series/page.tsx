import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { SeriesPageClient } from "@/components/series/SeriesPageClient";
import { getLatestPreparedData } from "@/lib/data/preparedData";
import { getFavoriteSeriesNames } from "@/lib/db/preferences";
import { createClient } from "@/lib/supabase/server";

export default async function SeriesPage() {
  const { season } = await getLatestPreparedData();
  const [authSlot, supabase] = await Promise.all([HeaderAuth(), createClient()]);
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const initialFavoriteSeries = user ? await getFavoriteSeriesNames(user.id).catch(() => []) : [];

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
