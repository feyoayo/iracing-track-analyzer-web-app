// @vitest-environment node
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, afterAll, expect, it } from "vitest";
import { createSchedulePrisma } from "../helpers/schedule-prisma";
import { importSeason } from "@/scripts/db/import-series";
import { refreshPdfSchedule } from "@/scripts/import-pdf";

let fixture: Awaited<ReturnType<typeof createSchedulePrisma>>;
let directory: string;
const selected = { seasonSlug: "2027-season-1", seasonName: "2027 Season 1", series: [
  { seriesName: "New series", seriesClass: "Formula", weeks: [
    { trackId: 99, trackName: "New track", weekNumber: 1, raceDate: "2027-01-12" },
  ] },
] };
const historical = { trackId: 10, trackName: "Spa", seasonName: "2026 Season 4", seriesName: "Preserved", seriesClass: "Sports Car", weekNumber: 1, raceDate: "2026-09-15" };
beforeAll(async () => {
  fixture = await createSchedulePrisma();
  directory = mkdtempSync(join(tmpdir(), "iracing-pdf-workflow-"));
  writeFileSync(join(directory, "parse.py"), "# Test parser: PDF content decoding is owned by the external analyzer.\n");
  writeFileSync(join(directory, "export_web_data.py"), `import json, pathlib, sys
out = pathlib.Path(sys.argv[sys.argv.index('--out') + 1])
pathlib.Path('last-export.txt').write_text(str(out))
(out / 'schedules').mkdir(parents=True, exist_ok=True)
for slug, season in json.loads(pathlib.Path('source.json').read_text()).items():
    (out / 'schedules' / (slug + '.json')).write_text(json.dumps(season))
(out / 'tracks-index.json').write_text('{"tracks": []}')
`);
  writeFileSync(join(directory, "schedule.pdf"), "test PDF");
});
afterAll(async () => { await fixture?.close(); if (directory) rmSync(directory, { recursive: true, force: true }); });

it("imports only the selected PDF season, preserves unrelated history and cleans temporary schedules", async () => {
  const existing = { ...selected, seasonSlug: "2026-season-4", seasonName: "2026 Season 4" };
  await importSeason(fixture.prisma, existing, { makeCurrent: true });
  writeFileSync(join(directory, "source.json"), JSON.stringify({
    "2027-season-1": selected,
    "2026-season-4": { ...existing, series: [{ ...existing.series[0], seriesName: "Stale SQLite data" }] },
  }));
  const indexPath = join(directory, "tracks-index.json");
  writeFileSync(indexPath, JSON.stringify({ tracks: [historical] }));
  await refreshPdfSchedule(fixture.prisma, {
    pdfPath: join(directory, "schedule.pdf"), season: "2027 Season 1", makeCurrent: false,
    analyzerDir: directory, tracksIndexPath: indexPath,
  });
  expect((await fixture.prisma.series.findMany({ where: { season: { slug: "2026-season-4" } } })).map(s => s.name)).toEqual(["New series"]);
  expect((await fixture.prisma.season.findFirstOrThrow({ where: { isCurrent: true } })).slug).toBe("2026-season-4");
  expect(JSON.parse(readFileSync(indexPath, "utf8")).tracks).toEqual([
    expect.objectContaining({ trackId: 99, seasonName: "2027 Season 1", seriesName: "New series" }), historical,
  ]);
  expect(existsSync(readFileSync(join(directory, "last-export.txt"), "utf8"))).toBe(false);
}, 30000);

it("leaves database and history intact and cleans output when the selected export is invalid", async () => {
  const indexPath = join(directory, "tracks-index.json");
  const before = readFileSync(indexPath, "utf8");
  writeFileSync(join(directory, "source.json"), JSON.stringify({ "2027-season-1": { ...selected, series: [] } }));
  await expect(refreshPdfSchedule(fixture.prisma, {
    pdfPath: join(directory, "schedule.pdf"), season: "2027 Season 1", makeCurrent: true,
    analyzerDir: directory, tracksIndexPath: indexPath,
  })).rejects.toThrow();
  expect(readFileSync(indexPath, "utf8")).toBe(before);
  expect((await fixture.prisma.season.findFirstOrThrow({ where: { isCurrent: true } })).slug).toBe("2026-season-4");
  expect(existsSync(readFileSync(join(directory, "last-export.txt"), "utf8"))).toBe(false);
}, 30000);
