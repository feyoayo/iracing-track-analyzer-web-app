import { TracksPageClient } from "@/components/tracks/TracksPageClient";
import { getLatestPreparedData } from "@/lib/data/preparedData";

export default async function TracksPage() {
  const { season } = await getLatestPreparedData();

  return <TracksPageClient season={season} />;
}
