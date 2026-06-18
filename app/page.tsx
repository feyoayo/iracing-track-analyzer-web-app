import { AppClient } from "@/components/app/AppClient";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { getLatestPreparedData } from "@/lib/data/preparedData";

export default async function Page() {
  const { season } = await getLatestPreparedData();
  const authSlot = await HeaderAuth();

  return (
    <AppClient
      season={season}
      authSlot={authSlot}
      utilitySlot={<FeedbackDialog />}
    />
  );
}
