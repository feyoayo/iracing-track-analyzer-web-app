import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import { AppClient } from "@/components/app/AppClient";
import { season } from "@/test/fixtures/weeklySeason";
vi.mock("xlsx", async importOriginal => ({ ...await importOriginal<typeof import("xlsx")>(), writeFile: vi.fn() }));
const props = { season, initialFavoriteSeries: ["Weekly", "Special"], ownedTrackIds: [], isAuthenticated: false };
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-14T12:00:00Z"));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("current week interface", () => {
  it("shows the season week and hides completed rounds by default", async () => {
    render(<AppClient {...props} />);
    expect(await screen.findByText("Week 2 · Nov 10–16")).toBeInTheDocument();
    expect(screen.getByText("2026 Season 4")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Past track" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Current track" })).toBeInTheDocument();
    expect(screen.getByText("2 tracks across 2 series")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Include past weeks" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByRole("link", { name: "Past track" })).toBeInTheDocument();
    expect(screen.getByText("3 tracks across 2 series")).toBeInTheDocument();
  });
  it("keeps the checkbox available when no upcoming races remain", async () => {
    vi.setSystemTime(new Date("2026-12-15T12:00:00Z"));
    render(<AppClient {...props} />);
    expect(await screen.findByText("No upcoming weeks")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Include past weeks" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByRole("link", { name: "Past track" })).toBeInTheDocument();
  });
  it("still renders analysis when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<AppClient {...props} />);
    expect(await screen.findByText("2 tracks across 2 series")).toBeInTheDocument();
  });
  it("keeps full-season Excel output while filtering the table", async () => {
    render(<AppClient {...props} />);
    await waitFor(() => expect(screen.getByText("2 tracks across 2 series")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Export Excel" }));
    const workbook = vi.mocked(XLSX.writeFile).mock.calls.at(-1)?.[0];
    expect(workbook).toBeDefined();
    expect(XLSX.utils.sheet_to_csv(workbook!.Sheets["Full Schedule"])).toContain("Past track");
  });
});
