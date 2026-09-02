import { render } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DayPlan } from "@/features/activity/types";

import { MapView } from "./MapView";

const shared = vi.hoisted(() => ({
  map: { fitBounds: vi.fn() },
  markers: [] as Array<{
    title?: string;
    eventHandlers?: Record<string, (...args: unknown[]) => void>;
  }>,
  setSelectedActivity: vi.fn(),
  containerProps: undefined as { center?: unknown } | undefined,
  mockDays: [] as DayPlan[],
  mockDestCoords: null as { lat: number; lng: number } | null,
}));

vi.mock("react-leaflet", () => {
  return {
    MapContainer: (props: { children: React.ReactNode; center?: unknown }) => {
      shared.containerProps = props;
      return <div>{props.children}</div>;
    },
    TileLayer: () => null,
    ZoomControl: () => null,
    Marker: (props: { title?: string; eventHandlers?: Record<string, (...args: unknown[]) => void> }) => {
      shared.markers.push(props);
      return null;
    },
    Tooltip: () => null,
    useMap: () => shared.map,
  };
});

vi.mock("leaflet", () => ({
  __esModule: true,
  default: {
    divIcon: () => ({}),
    latLng: vi.fn(() => ({ equals: () => false })),
    latLngBounds: vi.fn(() => ({})),
  },
}));

function renderMapView(days: DayPlan[], destCoords: { lat: number; lng: number } | null = null) {
  shared.mockDays = days;
  shared.mockDestCoords = destCoords;
  return render(
    <MapView days={days} destCoords={destCoords} onActivitySelect={shared.setSelectedActivity} />
  );
}

beforeEach(() => {
  shared.map.fitBounds.mockClear();
  shared.markers.length = 0;
  shared.containerProps = undefined;
  shared.mockDays = [];
  shared.mockDestCoords = null;
  shared.setSelectedActivity.mockClear();
});

describe.skip("FitAllMarkers effect", () => {
  const baseActivity = { id: "a1", title: "A1", color: "bg-[var(--color-1)]" };

  const buildDays = ([lat, lng]: [number, number]): DayPlan[] => [
    {
      id: "d1",
      label: "Day 1",
      activities: [{ ...baseActivity, latitude: lat, longitude: lng }],
    },
  ];

  it("runs when coordinates change", () => {
    shared.mockDays = buildDays([1, 1]);

    const { rerender } = render(
      <MapView
        days={shared.mockDays}
        destCoords={shared.mockDestCoords}
        onActivitySelect={shared.setSelectedActivity}
      />
    );

    expect(shared.map.fitBounds).toHaveBeenCalledTimes(1);

    rerender(
      <MapView
        days={shared.mockDays}
        destCoords={shared.mockDestCoords}
        onActivitySelect={shared.setSelectedActivity}
      />
    );

    expect(shared.map.fitBounds).toHaveBeenCalledTimes(1);

    shared.mockDays = buildDays([2, 2]);

    rerender(
      <MapView
        days={shared.mockDays}
        destCoords={shared.mockDestCoords}
        onActivitySelect={shared.setSelectedActivity}
      />
    );

    expect(shared.map.fitBounds).toHaveBeenCalledTimes(2);
  });
});

describe.skip("Marker accessibility", () => {
  it("sets each marker title", () => {
    const days: DayPlan[] = [
      {
        id: "d1",
        label: "Day 1",
        activities: [{ id: "a1", title: "Walk", color: "bg-[var(--color-1)]", latitude: 1, longitude: 1 }],
      },
    ];

    renderMapView(days);
    expect(shared.markers[0].title).toBe("Walk");
  });

  it("uses provided center coordinates when no activities", () => {
    const days: DayPlan[] = [{ id: "d1", label: "Day 1", activities: [] }];

    renderMapView(days, { lat: 5, lng: 6 });
    expect(shared.containerProps?.center).toEqual([5, 6]);
  });
});

describe("map render integration", () => {
  it("renders markers for activities", () => {
    const days: DayPlan[] = [
      {
        id: "d1",
        label: "Day 1",
        activities: [{ id: "a1", title: "Walk", color: "bg-[var(--color-1)]", latitude: 1, longitude: 1 }],
      },
    ];

    renderMapView(days);
  });

  it("centers map using provided coordinates", () => {
    const days: DayPlan[] = [{ id: "d1", label: "Day 1", activities: [] }];

    renderMapView(days, { lat: 3, lng: 4 });
    expect(shared.containerProps?.center).toEqual([3, 4]);
  });

  it("selects activity when marker clicked", () => {
    const days: DayPlan[] = [
      {
        id: "d1",
        label: "Day 1",
        activities: [{ id: "a1", title: "Walk", color: "bg-[var(--color-1)]", latitude: 1, longitude: 1 }],
      },
    ];

    renderMapView(days);
    shared.markers[0].eventHandlers?.click?.();

    expect(shared.setSelectedActivity).toHaveBeenCalledWith(expect.objectContaining({ id: "a1" }), "d1");
  });

  it("handles activities missing coordinates", () => {
    const days: DayPlan[] = [
      {
        id: "d1",
        label: "Day 1",
        activities: [{ id: "a1", title: "Walk", color: "bg-[var(--color-1)]" }],
      },
    ];

    renderMapView(days);
    expect(shared.markers.length).toBe(0);
    expect(shared.map.fitBounds).not.toHaveBeenCalled();
  });

  it("updates map bounds when days change", () => {
    const buildDays = (lat: number, lng: number): DayPlan[] => [
      {
        id: "d1",
        label: "Day 1",
        activities: [{ id: "a1", title: "A1", color: "bg-[var(--color-1)]", latitude: lat, longitude: lng }],
      },
    ];

    renderMapView(buildDays(1, 1));
    expect(shared.map.fitBounds).toHaveBeenCalledTimes(1);

    shared.map.fitBounds.mockClear();

    renderMapView(buildDays(2, 2));
    expect(shared.map.fitBounds).toHaveBeenCalledTimes(1);
  });

  it("selects activity on marker context menu", () => {
    const days: DayPlan[] = [
      {
        id: "d1",
        label: "Day 1",
        activities: [{ id: "a1", title: "Walk", color: "bg-[var(--color-1)]", latitude: 1, longitude: 1 }],
      },
    ];

    renderMapView(days);

    const preventDefault = vi.fn();
    shared.markers[0].eventHandlers?.contextmenu?.({
      originalEvent: { preventDefault },
    } as unknown as { originalEvent: { preventDefault: () => void } });

    expect(preventDefault).toHaveBeenCalled();
    expect(shared.setSelectedActivity).toHaveBeenCalledWith(expect.objectContaining({ id: "a1" }), "d1");
  });

  it("falls back to default center when no coordinates provided", () => {
    renderMapView([]);
    expect(shared.containerProps?.center).toEqual([0, 0]);
    expect(shared.map.fitBounds).not.toHaveBeenCalled();
  });

  it("adds markers when days update dynamically", () => {
    const buildDays = (title: string, lat: number, lng: number): DayPlan[] => [
      {
        id: "d1",
        label: "Day 1",
        activities: [{ id: "a1", title, color: "bg-[var(--color-1)]", latitude: lat, longitude: lng }],
      },
    ];

    renderMapView(buildDays("A1", 1, 1));
    expect(shared.markers).toHaveLength(1);

    renderMapView(buildDays("A2", 2, 2));
    expect(shared.markers).toHaveLength(2);
  });
});
