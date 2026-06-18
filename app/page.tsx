import { AppClient } from "@/components/app/AppClient";
import { getLatestPreparedData } from "@/lib/data/preparedData";

export default async function Page() {
  const { season } = await getLatestPreparedData();

  return <AppClient season={season} />;
}
