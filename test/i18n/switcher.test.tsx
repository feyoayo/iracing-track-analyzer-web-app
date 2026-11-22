import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { TracksPageClient } from "@/components/tracks/TracksPageClient";
import { AnalysisFilterDialog } from "@/components/analysis/AnalysisFilterDialog";
import season from "../fixtures/prepared-data/schedules/2026-season-3.json";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("language switcher", () => {
  it("saves UA before switching, updates lang and preserves search state and track names", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetcher);
    render(<I18nProvider initialLocale="en"><TracksPageClient season={season} initialOwnedTrackIds={[]} isAuthenticated={false} /></I18nProvider>);
    fireEvent.change(screen.getByPlaceholderText("Find a track"), { target: { value: "Spa" } });
    fireEvent.click(screen.getByRole("button", { name: "Українська" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Траси" })).toBeInTheDocument());
    expect(fetcher).toHaveBeenCalledWith("/api/locale", expect.objectContaining({ body: JSON.stringify({ locale: "uk" }) }));
    expect(screen.getByPlaceholderText("Знайти трасу")).toHaveValue("Spa");
    expect(screen.getByRole("link", { name: "Spa-Francorchamps" })).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.lang).toBe("uk"));
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Українська" })).toHaveAttribute("aria-pressed", "true");
  });
  it("keeps the previous language on save failure and supports retry", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetcher);
    render(<I18nProvider initialLocale="en"><LanguageSwitcher /></I18nProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Українська" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Українська" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Українська" })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("renders a saved UA selection and translates the filter dialog", () => {
    render(<I18nProvider initialLocale="uk"><LanguageSwitcher /><AnalysisFilterDialog classes={["Sports Car"]} series={[]} selectedClasses={["Sports Car"]} selectedSeries={[]} includePastWeeks={false} preferenceBusy={false} onApply={() => {}} /></I18nProvider>);
    expect(screen.getByRole("button", { name: "Українська" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Фільтри" }));
    expect(screen.getByRole("dialog", { name: "Фільтри" })).toBeInTheDocument();
    expect(screen.getByText("Включати минулі тижні")).toBeInTheDocument();
  });
});
