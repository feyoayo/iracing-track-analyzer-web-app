import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Page from "@/app/page";

describe("Page", () => {
  it("renders the current-season workflow shell", async () => {
    const element = await Page();
    render(element);

    expect(screen.getByText("iRacing Schedule Analyzer")).toBeInTheDocument();
    expect(screen.getByText("Active season")).toBeInTheDocument();
    expect(screen.getByText("Export Excel")).toBeInTheDocument();
  });
});
