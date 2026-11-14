import { AppClient } from "@/components/app/AppClient";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { getLatestPreparedData } from "@/lib/data/preparedData";
import { getOwnedTrackIds, getFavoriteSeriesNames } from "@/lib/db/preferences";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const { season } = await getLatestPreparedData();
  const [authSlot, supabase] = await Promise.all([HeaderAuth(), createClient()]);
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const [initialFavoriteSeries, ownedTrackIds] = user
    ? await Promise.all([
        getFavoriteSeriesNames(user.id).catch(() => []),
        getOwnedTrackIds(user.id).catch(() => []),
      ])
    : [[], []];

  return (
    <AppClient
      season={season}
      accountIncludePastWeeks={typeof user?.user_metadata?.include_past_weeks === "boolean"
        ? user.user_metadata.include_past_weeks : null}
      authSlot={authSlot}
      utilitySlot={<FeedbackDialog />}
      initialFavoriteSeries={initialFavoriteSeries}
      ownedTrackIds={ownedTrackIds}
      isAuthenticated={Boolean(user)}
    />
  );
}
