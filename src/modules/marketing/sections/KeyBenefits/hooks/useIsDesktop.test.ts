import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { useIsDesktop } from "./useIsDesktop";

type Listener = (event: MediaQueryListEvent) => void;

type MutableMediaQueryList = Omit<
  MediaQueryList,
  "matches" | "addEventListener" | "removeEventListener" | "addListener" | "removeListener"
> & {
  matches: boolean;
  addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
  addListener: (listener: EventListenerOrEventListenerObject) => void;
  removeListener: (listener: EventListenerOrEventListenerObject) => void;
};

function createMatchMedia(initialMatches: boolean, options?: { legacy?: boolean }) {
  const listeners = new Set<Listener>();

  const add = (listener: EventListenerOrEventListenerObject) => {
    if (typeof listener === "function") {
      listeners.add(listener as Listener);
    }
  };

  const remove = (listener: EventListenerOrEventListenerObject) => {
    if (typeof listener === "function") {
      listeners.delete(listener as Listener);
    }
  };

  const mediaQueryList: MutableMediaQueryList = {
    matches: initialMatches,
    media: "(min-width: 768px)",
    onchange: null,
    addEventListener: vi.fn((_, listener: EventListenerOrEventListenerObject) => {
      add(listener);
    }),
    removeEventListener: vi.fn((_, listener: EventListenerOrEventListenerObject) => {
      remove(listener);
    }),
    addListener: vi.fn((listener: EventListenerOrEventListenerObject) => {
      add(listener);
    }),
    removeListener: vi.fn((listener: EventListenerOrEventListenerObject) => {
      remove(listener);
    }),
    dispatchEvent: vi.fn(() => true),
  };

  if (options?.legacy) {
    mediaQueryList.addEventListener = undefined;
    mediaQueryList.removeEventListener = undefined;
  }

  const notify = (matches: boolean) => {
    mediaQueryList.matches = matches;
    const event = { matches } as MediaQueryListEvent;
    for (const listener of listeners) {
      listener(event);
    }
  };

  return { mediaQueryList, notify };
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia;
  } else {
    delete (window as { matchMedia?: typeof window.matchMedia }).matchMedia;
  }
  vi.restoreAllMocks();
});

describe("useIsDesktop", () => {
  test("returns the current match state and reacts to changes", async () => {
    const { mediaQueryList, notify } = createMatchMedia(false);
    const mockMatchMedia = vi.fn(() => mediaQueryList as unknown as MediaQueryList);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: mockMatchMedia as unknown as typeof window.matchMedia,
    });

    const { result, unmount } = renderHook(() => useIsDesktop("(min-width: 1024px)"));

    expect(mockMatchMedia).toHaveBeenCalledWith("(min-width: 1024px)");

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    act(() => {
      notify(true);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();

    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  test("falls back to legacy listener APIs when addEventListener is unavailable", async () => {
    const { mediaQueryList, notify } = createMatchMedia(true, { legacy: true });
    const mockMatchMedia = vi.fn(() => mediaQueryList as unknown as MediaQueryList);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: mockMatchMedia as unknown as typeof window.matchMedia,
    });

    const { result, unmount } = renderHook(() => useIsDesktop());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    expect(mediaQueryList.addListener).toHaveBeenCalledWith(expect.any(Function));
    expect(mediaQueryList.addEventListener).toBeUndefined();

    act(() => {
      notify(false);
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    unmount();

    expect(mediaQueryList.removeListener).toHaveBeenCalledWith(expect.any(Function));
  });
});
