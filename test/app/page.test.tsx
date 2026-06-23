import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Page from "@/app/page";
import ProfilePage from "@/app/profile/page";
import SeriesPage from "@/app/series/page";
import TracksPage from "@/app/tracks/page";

describe("Page", () => {
  it("renders the current-season workflow shell", async () => {
    const element = await Page();
    render(element);

    expect(screen.getByText("iRacing Schedule Analyzer")).toBeInTheDocument();
    expect(screen.getByText("Active season")).toBeInTheDocument();
    expect(screen.getByText("Export Excel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Series" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tracks" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /share your feedback/i }),
    ).toBeInTheDocument();
  });

  it("renders the tracks directory page", async () => {
    const element = await TracksPage();
    render(element);

    expect(screen.getByRole("heading", { name: "Tracks" })).toBeInTheDocument();
    expect(screen.getByLabelText("Track lookup")).toBeInTheDocument();
    expect(screen.getByText("Current season tracks")).toBeInTheDocument();
  });

  it("renders the series directory page", async () => {
    const element = await SeriesPage();
    render(element);

    expect(screen.getByRole("heading", { name: "Series" })).toBeInTheDocument();
    expect(screen.getByLabelText("Series lookup")).toBeInTheDocument();
    expect(screen.getByText("Current season series")).toBeInTheDocument();
  });

  it("renders the profile placeholder page", async () => {
    const element = await ProfilePage();
    render(element);

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Profile page placeholder.")).toBeInTheDocument();
  });
});
