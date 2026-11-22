// Parse PDFs with the analyzer repo, then import temporary schedule output to Postgres.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createImportClient, importSeason, parseSeasonImport } from "./db/import-series";
import { mergeSeasonIntoTracksIndex } from "../lib/data/trackHistory";
import type { PrismaClient } from "../lib/generated/prisma/client";
import type { TracksIndex } from "../lib/types";

export function parsePdfArgs(args: string[]): { pdf: string; season: string; makeCurrent: boolean } {
  let pdf: string | undefined;
  let season: string | undefined;
  let makeCurrent = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--current") { makeCurrent = true; }
    else if (args[i] === "--season") {
      if (season || !args[i + 1] || args[i + 1].startsWith("--")) throw new Error("--season needs one season name.");
      season = args[++i];
    } else if (args[i].startsWith("--") || pdf) { throw new Error("Unexpected PDF import argument."); }
    else { pdf = args[i]; }
  }
  if (!pdf) throw new Error("A PDF path is required.");
  const match = /^(\d{4})s([1-4])(?:\D|$)/i.exec(path.basename(pdf));
  season ??= match ? `${match[1]} Season ${Number(match[2])}` : undefined;
  if (!season || !/^[1-9]\d{3} Season [1-4]$/.test(season)) throw new Error('Pass --season "YYYY Season N" (N=1..4).');
  return { pdf, season, makeCurrent };
}

export async function runPdfImport(args: string[]): Promise<void> {
  const { pdf, season, makeCurrent } = parsePdfArgs(args);
  const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const analyzerDir = path.resolve(process.env.ANALYZER_DIR ?? path.join(webRoot, "..", "iracing-track-analyzer"));
  const db = createImportClient();
  try {
    await refreshPdfSchedule(db, {
      pdfPath: path.resolve(pdf), season, makeCurrent, analyzerDir,
      tracksIndexPath: path.join(webRoot, "data", "tracks-index.json"),
    });
  } finally { await db.$disconnect(); }
}

export async function refreshPdfSchedule(db: PrismaClient, options: {
  pdfPath: string; season: string; makeCurrent: boolean; analyzerDir: string; tracksIndexPath: string;
}): Promise<void> {
  const { pdfPath, season, makeCurrent, analyzerDir, tracksIndexPath } = options;
  if (!existsSync(pdfPath)) throw new Error("PDF file not found.");
  if (!existsSync(path.join(analyzerDir, "parse.py"))) throw new Error("Analyzer repo not found; set ANALYZER_DIR.");
  const venvPython = path.join(analyzerDir, "venv", "bin", "python");
  const python = existsSync(venvPython) ? venvPython : "python3";
  const temporary = mkdtempSync(path.join(tmpdir(), "iracing-schedule-"));
  const stagedIndex = path.join(path.dirname(tracksIndexPath), `.tracks-index-${randomUUID()}.json`);
  function run(script: string, scriptArgs: string[]): void {
    console.log(`[import-pdf] ${script}`);
    const result = spawnSync(python, [script, ...scriptArgs], { cwd: analyzerDir, stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Analyzer script ${script} failed.`);
  }
  try {
    run("parse.py", ["--pdf", pdfPath, "--season", season, "--verbose"]);
    run("export_web_data.py", ["--out", temporary]);
    const slug = season.toLowerCase().replaceAll(" ", "-");
    const source = parseSeasonImport(JSON.parse(readFileSync(path.join(temporary, "schedules", `${slug}.json`), "utf8")));
    if (source.seasonSlug !== slug || source.seasonName !== season) throw new Error("Exported season does not match the selected PDF season.");
    const existing = JSON.parse(readFileSync(tracksIndexPath, "utf8")) as TracksIndex;
    const merged = mergeSeasonIntoTracksIndex(existing, source);
    // Ignore the exporter's unrelated SQLite seasons and partial track index.
    // Stage history before importing, then atomically replace it after success.
    writeFileSync(stagedIndex, JSON.stringify(merged, null, 2) + "\n", { flag: "wx" });
    await importSeason(db, source, { makeCurrent });
    renameSync(stagedIndex, tracksIndexPath);
    console.log(`[import-pdf] Imported ${season} into Postgres${makeCurrent ? " and selected it as current" : ""}.`);
  } finally {
    rmSync(stagedIndex, { force: true });
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPdfImport(process.argv.slice(2)).catch(() => {
    console.error('[import-pdf] Import failed. Check PDF/analyzer paths, DIRECT_URL, and migrations. Usage: npm run import-pdf -- <schedule.pdf> [--season "2026 Season 4"] [--current]');
    process.exitCode = 1;
  });
}
