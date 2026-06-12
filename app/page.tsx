import metadata from "@/data/metadata.json";
import tracksIndex from "@/data/tracks-index.json";

import { AppClient } from "@/components/app/AppClient";

export default async function Page() {
  const preparedSeason = (
    await import(`@/data/schedules/${metadata.latestSeasonSlug}.json`)
  ).default;

  return (
    <AppClient
      season={{
        ...preparedSeason,
        seasonName: metadata.latestSeasonName,
      }}
      tracksIndex={tracksIndex}
    />
  );
}
