import { cleanup, act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnalysisPreference } from "@/components/analysis/useAnalysisPreference";
const key = "iracing-track-analyzer-include-past-weeks";
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("analysis preference persistence", () => {
  it("defaults guests to upcoming and remembers their choice", async () => {
    const { result, unmount } = renderHook(() => useAnalysisPreference(false, null));
    expect(result.current.includePastWeeks).toBe(false);
    await act(() => result.current.change(true));
    expect(localStorage.getItem(key)).toBe("true");
    unmount();
    const restored = renderHook(() => useAnalysisPreference(false, null));
    expect(restored.result.current.includePastWeeks).toBe(true);
  });
  it("gives the account value priority without changing the guest preference", async () => {
    localStorage.setItem(key, "true");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ includePastWeeks: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAnalysisPreference(true, false));
    expect(result.current.includePastWeeks).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    await act(() => result.current.change(true));
    expect(fetchMock).toHaveBeenCalledWith("/api/analysis-preferences", expect.objectContaining({ body: JSON.stringify({ includePastWeeks: true, initializeOnly: false }) }));
    expect(localStorage.getItem(key)).toBe("true");
  });
  it("imports guest choice only when the account has no setting", async () => {
    localStorage.setItem(key, "true");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ includePastWeeks: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAnalysisPreference(true, null));
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.includePastWeeks).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/analysis-preferences", expect.objectContaining({ body: JSON.stringify({ includePastWeeks: true, initializeOnly: true }) }));
  });
  it("adopts a fresher account preference returned during guest import", async () => {
    localStorage.setItem(key, "true");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ includePastWeeks: false }) }));
    const { result } = renderHook(() => useAnalysisPreference(true, null));
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.includePastWeeks).toBe(false);
  });
  it("surfaces failed account saves and can retry", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ok: true, json: async () => ({ includePastWeeks: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAnalysisPreference(true, false));
    await act(() => result.current.change(true));
    expect(result.current.error).toBeTruthy();
    expect(result.current.includePastWeeks).toBe(true);
    await act(() => result.current.retry());
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("releases pending state when refreshed account props arrive", async () => {
    let finish: ((value: unknown) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(resolve => { finish = resolve; })));
    const { result, rerender } = renderHook(({ value }: { value: boolean | null }) => useAnalysisPreference(true, value), { initialProps: { value: null as boolean | null } });
    expect(result.current.busy).toBe(true);
    rerender({ value: false });
    expect(result.current.busy).toBe(false);
    await act(async () => { finish?.({ ok: true, json: async () => ({ includePastWeeks: true }) }); });
    expect(result.current.includePastWeeks).toBe(false);
  });
  it("continues to work when browser storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { result } = renderHook(() => useAnalysisPreference(false, null));
    await act(() => result.current.change(true));
    expect(result.current.includePastWeeks).toBe(true);
    expect(result.current.error).toBeTruthy();
  });
});
