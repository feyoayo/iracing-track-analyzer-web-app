import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { normalizePreparedSeason } from "../../lib/data/seriesClassOverrides";
import type { PreparedSeason } from "../../lib/types";
import { postgresConnectionConfig } from "../../lib/db/ssl";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a schedule object.");
  return value as Record<string, unknown>;
}
function nonblank(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Schedule names must not be blank.");
  return value.trim();
}
function integer(value: unknown, positive = false): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < (positive ? 1 : 0) || value > 2147483647) {
    throw new Error("Invalid schedule integer.");
  }
  return value;
}
function date(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Expected a YYYY-MM-DD schedule date.");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || !Number(value.slice(0, 4))) {
    throw new Error("Invalid calendar date.");
  }
  return value;
}

/** Validate the complete source before entering a transaction. Links are managed separately. */
export function parseSeasonImport(input: unknown): PreparedSeason {
  const source = object(input);
  const seasonSlug = nonblank(source.seasonSlug);
  if (!/^[1-9]\d{3}-season-[1-4]$/.test(seasonSlug)) throw new Error("Expected season slug YYYY-season-N (N=1..4).");
  const seasonName = nonblank(source.seasonName);
  if (!Array.isArray(source.series) || !source.series.length) throw new Error("A season must include series.");
  const names = new Set<string>();
  const series = source.series.map(value => {
    const entry = object(value);
    const seriesName = nonblank(entry.seriesName);
    const seriesClass = nonblank(entry.seriesClass);
    if (names.has(seriesName)) throw new Error("Duplicate series name within a season.");
    names.add(seriesName);
    if (!["Formula", "Sports Car", "Oval", "Other"].includes(seriesClass)) throw new Error("Unsupported series category.");
    if (!Array.isArray(entry.weeks) || !entry.weeks.length) throw new Error("A series must include scheduled weeks.");
    const seenWeeks = new Set<number>();
    const weeks = entry.weeks.map(value => {
      const week = object(value);
      const weekNumber = integer(week.weekNumber, true);
      if (seenWeeks.has(weekNumber)) throw new Error("Duplicate week within a series.");
      seenWeeks.add(weekNumber);
      return { trackId: integer(week.trackId), trackName: nonblank(week.trackName), weekNumber, raceDate: date(week.raceDate) };
    });
    return { seriesName, seriesClass, weeks };
  });
  return normalizePreparedSeason({ seasonSlug, seasonName, series });
}

export async function importSeason(
  db: PrismaClient,
  input: unknown,
  options: { makeCurrent: boolean },
): Promise<void> {
  const season = parseSeasonImport(input);
  const [year, seasonNumber] = season.seasonSlug.split("-season-").map(Number);
  await db.$transaction(async tx => {
    // All importers share this lock: current-pointer changes and overlapping
    // re-imports cannot interleave. It is released on commit or rollback.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(20261115)::text`;
    const row = await tx.season.upsert({
      where: { slug: season.seasonSlug },
      create: { slug: season.seasonSlug, name: season.seasonName, year, seasonNumber },
      update: { name: season.seasonName, year, seasonNumber },
      select: { id: true },
    });
    if (options.makeCurrent) {
      await tx.season.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      await tx.season.update({ where: { id: row.id }, data: { isCurrent: true } });
    }
    for (const entry of season.series) {
      const series = await tx.series.upsert({
        where: { seasonId_name: { seasonId: row.id, name: entry.seriesName } },
        create: { seasonId: row.id, name: entry.seriesName, category: entry.seriesClass },
        update: { category: entry.seriesClass },
        select: { id: true },
      });
      await tx.seriesWeek.deleteMany({ where: { seriesId: series.id } });
      await tx.seriesWeek.createMany({ data: entry.weeks.map(week => ({
        seriesId: series.id, weekNumber: week.weekNumber, trackId: week.trackId,
        trackName: week.trackName, raceDate: new Date(`${week.raceDate}T00:00:00.000Z`),
      })) });
    }
    await tx.series.deleteMany({ where: { seasonId: row.id, name: { notIn: season.series.map(entry => entry.seriesName) } } });
  }, { timeout: 60000, maxWait: 10000 });
}

/** CLI-only administrator connection; never import this client into application code. */
export function createImportClient(): PrismaClient {
  config({ path: ".env.local", quiet: true }); config({ path: ".env", quiet: true });
  if (!process.env.DIRECT_URL) throw new Error("Set the server-only DIRECT_URL for schedule imports.");
  return new PrismaClient({ adapter: new PrismaPg({ ...postgresConnectionConfig(process.env.DIRECT_URL), max: 1, connectionTimeoutMillis: 5000 }) });
}

export async function runImportCli(args: string[]): Promise<void> {
  const [file, ...flags] = args;
  if (!file || file.startsWith("--") || flags.some(flag => flag !== "--current") || flags.length > 1) {
    throw new Error("Usage: npm run db:import-series -- <schedule.json> [--current]");
  }
  const source = parseSeasonImport(JSON.parse(readFileSync(resolve(file), "utf8")));
  const db = createImportClient();
  try {
    await importSeason(db, source, { makeCurrent: flags.includes("--current") });
    console.log(`Imported ${source.seasonSlug}: ${source.series.length} series.`);
  } finally { await db.$disconnect(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runImportCli(process.argv.slice(2)).catch(() => {
    // Driver errors and file paths may contain sensitive configuration.
    console.error("Schedule import failed. Check the source file, DIRECT_URL, and applied migrations. Usage: npm run db:import-series -- <schedule.json> [--current]");
    process.exitCode = 1;
  });
}
