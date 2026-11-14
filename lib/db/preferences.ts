import "server-only";

import { withDatabaseIdentity } from "@/lib/db/context";

export async function getOwnedTrackIds(userId: string): Promise<number[]> {
  return withDatabaseIdentity(userId, async (tx) => {
    const rows = await tx.userOwnedTrack.findMany({ where: { userId }, select: { trackId: true } });
    return rows.map((row) => row.trackId);
  });
}

export async function getFavoriteSeriesNames(userId: string): Promise<string[]> {
  return withDatabaseIdentity(userId, async (tx) => {
    const rows = await tx.userFavoriteSeries.findMany({ where: { userId }, select: { seriesName: true } });
    return rows.map((row) => row.seriesName);
  });
}

export async function setTrackOwned(userId: string, trackId: number, owned: boolean): Promise<void> {
  await withDatabaseIdentity(userId, async (tx) => {
    if (owned) await tx.userOwnedTrack.createMany({ data: [{ userId, trackId }], skipDuplicates: true });
    else await tx.userOwnedTrack.deleteMany({ where: { userId, trackId } });
  });
}

export async function setSeriesFavorite(userId: string, seriesName: string, favorite: boolean): Promise<void> {
  await withDatabaseIdentity(userId, async (tx) => {
    if (favorite) await tx.userFavoriteSeries.createMany({ data: [{ userId, seriesName }], skipDuplicates: true });
    else await tx.userFavoriteSeries.deleteMany({ where: { userId, seriesName } });
  });
}
