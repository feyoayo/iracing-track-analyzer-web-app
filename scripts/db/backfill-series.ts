import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createImportClient, importSeason, parseSeasonImport } from "./import-series";
import type { PreparedSeason } from "../../lib/types";

export function readSeasonImports(directory: string, currentSlug: string): PreparedSeason[] {
  const seasons = readdirSync(directory).filter(name => name.endsWith(".json")).sort()
    .map(name => parseSeasonImport(JSON.parse(readFileSync(join(directory, name), "utf8"))));
  if (!seasons.some(season => season.seasonSlug === currentSlug)) throw new Error("The explicitly current season is missing from the import directory.");
  if (new Set(seasons.map(season => season.seasonSlug)).size !== seasons.length) throw new Error("Duplicate season slug in import directory.");
  return seasons.sort((a, b) => Number(a.seasonSlug === currentSlug) - Number(b.seasonSlug === currentSlug));
}

export async function runBackfillCli(args: string[]): Promise<void> {
  const [directory, flag, currentSlug, ...extra] = args;
  if (!directory || flag !== "--current" || !currentSlug || extra.length) {
    throw new Error("Usage: npm run db:backfill-series -- <directory> --current <season-slug>");
  }
  // Validate every file before importing any of them. Each season is atomic.
  const seasons = readSeasonImports(resolve(directory), currentSlug);
  const db = createImportClient();
  try {
    for (const season of seasons) {
      await importSeason(db, season, { makeCurrent: season.seasonSlug === currentSlug });
      console.log(`Imported ${season.seasonSlug}: ${season.series.length} series, ${season.series.reduce((n, s) => n + s.weeks.length, 0)} weeks.`);
    }
    console.log("Backfill complete. Verify database counts and application reads before removing source files.");
  } finally { await db.$disconnect(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBackfillCli(process.argv.slice(2)).catch(() => {
    console.error("Backfill failed. Check source schedules, DIRECT_URL, and applied migrations. Usage: npm run db:backfill-series -- <directory> --current <season-slug>");
    process.exitCode = 1;
  });
}
