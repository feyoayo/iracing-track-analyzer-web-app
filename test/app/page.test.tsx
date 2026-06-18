import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Page from "@/app/page";
import TracksPage from "@/app/tracks/page";

describe("Page", () => {
  it("renders the current-season workflow shell", async () => {
    const element = await Page();
    render(element);

    expect(screen.getByText("iRacing Schedule Analyzer")).toBeInTheDocument();
    expect(screen.getByText("Active season")).toBeInTheDocument();
    expect(screen.getByText("Export Excel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tracks" })).toBeInTheDocument();
  });

  it("renders the tracks directory page", async () => {
    const element = await TracksPage();
    render(element);

    expect(screen.getByRole("heading", { name: "Tracks" })).toBeInTheDocument();
    expect(screen.getByLabelText("Track lookup")).toBeInTheDocument();
    expect(screen.getByText("Current season tracks")).toBeInTheDocument();
  });
});
