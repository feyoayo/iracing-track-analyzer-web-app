// @vitest-environment node
import { expect, it } from "vitest";
import { parsePdfArgs } from "@/scripts/import-pdf";
it("keeps PDF selection, season override and current flag separate", () => {
  expect(parsePdfArgs(["--season", "2027 Season 1", "schedule.pdf", "--current"])).toEqual({ pdf: "schedule.pdf", season: "2027 Season 1", makeCurrent: true });
  expect(parsePdfArgs(["2026s4.pdf"])).toEqual({ pdf: "2026s4.pdf", season: "2026 Season 4", makeCurrent: false });
});
it.each([
  { args: [] }, { args: ["--season"] }, { args: ["a.pdf", "b.pdf"] },
  { args: ["a.pdf", "--unknown"] }, { args: ["schedule.pdf"] },
])("rejects ambiguous PDF arguments $args", ({ args }) => {
  expect(() => parsePdfArgs(args)).toThrow();
});
