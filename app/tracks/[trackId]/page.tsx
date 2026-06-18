import { notFound } from "next/navigation";

import { TrackDetailPage } from "@/components/tracks/TrackDetailPage";
import { getLatestPreparedData } from "@/lib/data/preparedData";
import { getTrackUsageById } from "@/lib/tracks/findTrackUsage";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const [{ season, tracksIndex }, resolvedParams] = await Promise.all([
    getLatestPreparedData(),
    params,
  ]);
  const trackId = Number.parseInt(resolvedParams.trackId, 10);

  if (Number.isNaN(trackId)) {
    notFound();
  }

  const usage = getTrackUsageById(season, tracksIndex, trackId);
  if (!usage) {
    notFound();
  }

  return <TrackDetailPage seasonName={season.seasonName} usage={usage} />;
}
