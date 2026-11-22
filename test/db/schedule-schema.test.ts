// @vitest-environment node
import { afterAll, beforeAll, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createScheduleDatabase } from "../helpers/schedule-database";

let db: PGlite;
beforeAll(async () => { db = await createScheduleDatabase(); }, 30000);
afterAll(async () => { await db?.close(); });

it("enforces unique seasons, series, weeks and one current season", async () => {
  await db.exec(`INSERT INTO seasons(slug,name,year,season_number,is_current) VALUES ('2026-season-4','2026 Season 4',2026,4,true)`);
  await expect(db.exec(`INSERT INTO seasons(slug,name,year,season_number,is_current) VALUES ('other','Other',2026,4,false)`)).rejects.toThrow();
  await expect(db.exec(`INSERT INTO seasons(slug,name,year,season_number,is_current) VALUES ('2027-season-1','2027 Season 1',2027,1,true)`)).rejects.toThrow();
  await db.exec(`INSERT INTO series(season_id,name,category) SELECT id,'GT3 Open','Sports Car' FROM seasons`);
  await expect(db.exec(`INSERT INTO series(season_id,name,category) SELECT id,'GT3 Open','Sports Car' FROM seasons`)).rejects.toThrow();
  await expect(db.exec(`INSERT INTO series(season_id,name,category) SELECT id,'Bad','Unknown' FROM seasons`)).rejects.toThrow();
  await db.exec(`INSERT INTO series_weeks SELECT id,1,10,'Spa','2026-09-15' FROM series`);
  await expect(db.exec(`INSERT INTO series_weeks SELECT id,1,10,'Spa','2026-09-15' FROM series`)).rejects.toThrow();
  await expect(db.exec(`INSERT INTO series_weeks SELECT id,0,10,'Spa','2026-09-15' FROM series`)).rejects.toThrow();
});

it("accepts related variants, rejects invalid links and clears only the deleted target reference", async () => {
  await db.exec(`
    INSERT INTO seasons(slug,name,year,season_number) VALUES ('2027-season-1','2027 Season 1',2027,1);
    INSERT INTO series(season_id,name,category,linked_to)
      SELECT season_id,'GT3 Fixed','Sports Car',id FROM series WHERE name='GT3 Open';
    INSERT INTO series(season_id,name,category,linked_to)
      SELECT season_id,'GT3 Sprint','Sports Car',id FROM series WHERE name='GT3 Open';
  `);
  await expect(db.exec(`UPDATE series SET linked_to=id WHERE name='GT3 Fixed'`)).rejects.toThrow();
  await expect(db.exec(`UPDATE series SET linked_to=999999 WHERE name='GT3 Fixed'`)).rejects.toThrow();
  await expect(db.exec(`INSERT INTO series(season_id,name,category,linked_to) SELECT seasons.id,'Wrong season','Sports Car',series.id FROM seasons CROSS JOIN series WHERE seasons.year=2027 AND series.name='GT3 Open'`)).rejects.toThrow();
  await db.exec(`INSERT INTO series_weeks SELECT id,1,10,'Spa','2026-09-15' FROM series WHERE name='GT3 Fixed'`);
  await db.exec(`DELETE FROM series WHERE name='GT3 Open'`);
  expect((await db.query(`SELECT name,linked_to FROM series ORDER BY name`)).rows).toEqual([
    { name: "GT3 Fixed", linked_to: null }, { name: "GT3 Sprint", linked_to: null },
  ]);
  expect((await db.query(`SELECT week_number FROM series_weeks`)).rows).toEqual([{ week_number: 1 }]);
  expect((await db.query(`SELECT count(*)::int AS count FROM series WHERE season_id IS NOT NULL`)).rows).toEqual([{ count: 2 }]);
});

it.each(["anon", "authenticated"])("allows %s to read schedules and denies all write operations", async role => {
  await db.exec(`SET ROLE ${role}`);
  try {
    expect((await db.query(`SELECT name FROM series ORDER BY name`)).rows).toHaveLength(2);
    for (const table of ["seasons", "series", "series_weeks"]) {
      expect((await db.query(`SELECT * FROM ${table}`)).rows.length).toBeGreaterThan(0);
      for (const operation of ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]) {
        expect((await db.query(`SELECT has_table_privilege(current_user, $1, $2) AS allowed`, [table, operation])).rows).toEqual([{ allowed: false }]);
      }
      await expect(db.exec(`DELETE FROM ${table}`)).rejects.toThrow(/permission denied/);
      await expect(db.exec(`TRUNCATE ${table} CASCADE`)).rejects.toThrow(/permission denied/);
    }
  } finally { await db.exec("RESET ROLE"); }
});

it("keeps row-level security enabled on every new public table", async () => {
  expect((await db.query(`SELECT relname, relrowsecurity FROM pg_class WHERE oid IN ('public.seasons'::regclass, 'public.series'::regclass, 'public.series_weeks'::regclass) ORDER BY relname`)).rows).toEqual([
    { relname: "seasons", relrowsecurity: true },
    { relname: "series", relrowsecurity: true },
    { relname: "series_weeks", relrowsecurity: true },
  ]);
});
