import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDestinationCoordinates } from "./useDestinationCoordinates";
import { usePlaceSelection } from "./usePlaceSelection";

beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const selection = { name: "Museum, a long address", placeId: "place/1", latitude: 0, longitude: 12 };

describe("usePlaceSelection", () => {
  it("normalizes the title and enriches the selection with details", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          details: { formatted: "Full address", description: "Details" },
          wikidataImageUrl: "photo.jpg",
        })
      )
    );
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => usePlaceSelection());
    expect(await result.current.selectPlace(selection)).toEqual({
      title: "Museum",
      address: "Full address",
      description: "Details",
      imageUrl: "photo.jpg",
      latitude: 0,
      longitude: 12,
    });
    expect(fetch).toHaveBeenCalledWith("/api/places/details?placeId=place%2F1", {
      signal: expect.any(AbortSignal),
    });
  });

  it.each(["network", "http", "json"])("keeps suggestion data on a %s failure", async (failure) => {
    const fetch = vi.fn();
    if (failure === "network") fetch.mockRejectedValue(new Error("offline"));
    else fetch.mockResolvedValue(new Response("invalid json", { status: failure === "http" ? 500 : 200 }));
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => usePlaceSelection());
    expect(await result.current.selectPlace(selection)).toMatchObject({
      title: "Museum",
      address: selection.name,
      latitude: 0,
      longitude: 12,
    });
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("Place details lookup failed", {
      operation: "placeDetails",
      placeId: "place/1",
      error: expect.any(Error),
    });
  });

  it("ignores superseded responses even if the transport ignores abort", async () => {
    let finish!: (response: Response) => void;
    const fetch = vi.fn().mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetch);
    const { result, unmount } = renderHook(() => usePlaceSelection());
    const first = result.current.selectPlace(selection);
    expect(await result.current.selectPlace({ ...selection, name: "Latest", placeId: "" })).toMatchObject({
      title: "Latest",
    });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    finish(new Response("{}"));
    expect(await first).toBeNull();
    fetch.mockResolvedValue(new Response("{}"));
    const pending = result.current.selectPlace(selection);
    unmount();
    expect(await pending).toBeNull();
    expect(fetch.mock.calls[1][1].signal.aborted).toBe(true);
  });
});

describe("useDestinationCoordinates", () => {
  it.each(["network", "http", "json"])(
    "logs a %s failure and keeps coordinates optional",
    async (failure) => {
      const fetch = vi.fn();
      if (failure === "network") fetch.mockRejectedValue(new Error("offline"));
      else fetch.mockResolvedValue(new Response("invalid json", { status: failure === "http" ? 500 : 200 }));
      vi.stubGlobal("fetch", fetch);
      const { result } = renderHook(() => useDestinationCoordinates("Salvador"));
      await waitFor(() =>
        expect(console.warn).toHaveBeenCalledExactlyOnceWith("Destination coordinates lookup failed", {
          operation: "destinationCoordinates",
          destination: "Salvador",
          error: expect.any(Error),
        })
      );
      expect(result.current).toBeNull();
    }
  );

  it("clears old coordinates when the destination changes or is removed", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{ latitude: 0, longitude: 12 }] })))
      .mockResolvedValue(new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetch);
    const { result, rerender } = renderHook(({ dest }) => useDestinationCoordinates(dest), {
      initialProps: { dest: "First" },
    });
    await waitFor(() => expect(result.current).toEqual({ lat: 0, lng: 12 }));
    rerender({ dest: "Second" });
    expect(result.current).toBeNull();
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    rerender({ dest: "" });
    expect(result.current).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("ignores late coordinate responses after changing destination", async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          })
      )
    );
    const { result, rerender } = renderHook(({ dest }) => useDestinationCoordinates(dest), {
      initialProps: { dest: "First" },
    });
    rerender({ dest: "" });
    await act(async () => finish(new Response(JSON.stringify({ results: [{ latitude: 1, longitude: 2 }] }))));
    expect(result.current).toBeNull();
  });
});

it("does not warn when cancelled lookups reject", async () => {
  let reject!: (error: Error) => void;
  const request = new Promise<Response>((_, fail) => {
    reject = fail;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(() => request)
  );
  const place = renderHook(() => usePlaceSelection());
  const destination = renderHook(() => useDestinationCoordinates("Salvador"));
  const pending = place.result.current.selectPlace(selection);
  place.result.current.cancelSelection();
  destination.unmount();
  await act(async () => {
    reject(new DOMException("Cancelled", "AbortError"));
    expect(await pending).toBeNull();
  });
  expect(console.warn).not.toHaveBeenCalled();
});
