import type {
  PreparedMetadata,
  PreparedSeason,
  TracksIndex,
} from "@/lib/types";

export function parsePreparedMetadata(raw: string): PreparedMetadata {
  return JSON.parse(raw) as PreparedMetadata;
}

export function parsePreparedSeason(raw: string): PreparedSeason {
  return JSON.parse(raw) as PreparedSeason;
}

export function parseTracksIndex(raw: string): TracksIndex {
  return JSON.parse(raw) as TracksIndex;
}
