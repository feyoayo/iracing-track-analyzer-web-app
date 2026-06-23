import { notFound } from "next/navigation";

import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { SeriesDetailPage } from "@/components/series/SeriesDetailPage";
import { normalizePreparedSeason } from "@/lib/data/seriesClassOverrides";
import { getLatestPreparedData } from "@/lib/data/preparedData";

export default async function SeriesDetailRoute({
  params,
}: {
  params: Promise<{ seriesName: string }>;
}) {
  const [{ season }, authSlot, resolvedParams] = await Promise.all([
    getLatestPreparedData(),
    HeaderAuth(),
    params,
  ]);
  const normalizedSeason = normalizePreparedSeason(season);
  const seriesName = decodeURIComponent(resolvedParams.seriesName);
  const series = normalizedSeason.series.find(
    (entry) => entry.seriesName === seriesName,
  );

  if (!series) {
    notFound();
  }

  return (
    <SeriesDetailPage
      seasonName={normalizedSeason.seasonName}
      series={series}
      authSlot={authSlot}
      utilitySlot={<FeedbackDialog />}
    />
  );
}
