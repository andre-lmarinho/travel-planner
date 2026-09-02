import { render } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DayPlan } from "@/features/activity/types";
import { PlannerProvider } from "@/modules/planner/hooks/PlannerContext";

import { MapView } from "./MapView";

const shared = vi.hoisted(() => ({
  map: { fitBounds: vi.fn() },
  markers: [] as Array<{
    title?: string;
    eventHandlers?: Record<string, (...args: unknown[]) => void>;
  }>,
  polylines: [] as Array<unknown>,
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
    Marker: (props: { title?: string; eventHandlers?: Record<string, (...args: unknown[]) => void> }) => {
      shared.markers.push(props);
      return null;
    },
    Polyline: (props: unknown) => {
      shared.polylines.push(props);
      return null;
    },
    useMap: () => shared.map,
  };
});

vi.mock("leaflet", () => ({
  __esModule: true,
  default: {
    divIcon: () => ({}),
    latLngBounds: vi.fn(() => ({})),
  },
}));

vi.mock("@/modules/planner/hooks/PlannerContext", () => {
  return {
    __esModule: true,
    PlannerProvider: ({ children }: { children: React.ReactNode; planId?: string }) => <>{children}</>,
    usePlannerContext: () => ({
      planId: "p1",
      dest: "rome",
      days: shared.mockDays,
      destCoords: shared.mockDestCoords,
      setSelectedActivity: shared.setSelectedActivity,
      setDays: vi.fn(),
      sensors: undefined,
      collisionDetection: vi.fn(),
      handleDragStart: vi.fn(),
      handleDragOver: vi.fn(),
      handleDragEnd: vi.fn(),
      addBlankAndSelect: vi.fn(),
      changeDay: vi.fn(),
      changePosition: vi.fn(),
      changeColor: vi.fn(),
      insertActivityAt: vi.fn(),
      replaceActivity: vi.fn(),
      removeActivity: vi.fn(),
      updateActivity: vi.fn(),
      selectedActivity: null,
      currentRange: undefined,
      handleRangeChange: vi.fn(),
      canEdit: true,
    }),
  };
});

vi.mock("@/features/activity/hooks/state/planner/usePlanner", () => ({
  usePlanner: () => ({
    planId: "p1",
    dest: "rome",
    days: shared.mockDays,
    destCoords: shared.mockDestCoords,
    setDays: vi.fn(),
    currentRange: undefined,
    handleRangeChange: vi.fn(),
    activeId: null,
    sensors: [],
    collisionDetection: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    addActivity: vi.fn(),
    removeActivity: vi.fn(),
    updateActivity: vi.fn(),
    addBlankActivity: vi.fn(),
    insertActivityAt: vi.fn(),
    replaceActivity: vi.fn(),
  }),
}));

vi.mock("@/features/activity/hooks/state/planner/useSelectedActivity", () => ({
  useSelectedActivity: () => ({
    selectedActivity: null,
    setSelectedActivity: shared.setSelectedActivity,
    changeDay: vi.fn(),
    changePosition: vi.fn(),
    addBlankAndSelect: vi.fn(),
    closeDialog: vi.fn(),
    save: vi.fn(),
    deleteActivity: vi.fn(),
    changeColor: vi.fn(),
  }),
}));

function renderMapView(days: DayPlan[], destCoords: { lat: number; lng: number } | null = null) {
  shared.mockDays = days;
  shared.mockDestCoords = destCoords;
  return render(
    <PlannerProvider planId="p1">
      <MapView />
    </PlannerProvider>
  );
}

beforeEach(() => {
  shared.map.fitBounds.mockClear();
  shared.markers.length = 0;
  shared.polylines.length = 0;
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
      <PlannerProvider planId="p1">
        <MapView />
      </PlannerProvider>
    );

    expect(shared.map.fitBounds).toHaveBeenCalledTimes(1);

    rerender(
      <PlannerProvider planId="p1">
        <MapView />
      </PlannerProvider>
    );

    expect(shared.map.fitBounds).toHaveBeenCalledTimes(1);

    shared.mockDays = buildDays([2, 2]);

    rerender(
      <PlannerProvider planId="p1">
        <MapView />
      </PlannerProvider>
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

  it("does not render a path for multiple activities", () => {
    const days: DayPlan[] = [
      {
        id: "d1",
        label: "Day 1",
        activities: [
          { id: "a1", title: "A1", color: "bg-[var(--color-1)]", latitude: 1, longitude: 1 },
          { id: "a2", title: "A2", color: "bg-[var(--color-1)]", latitude: 2, longitude: 2 },
        ],
      },
    ];

    renderMapView(days);
    expect(shared.polylines.length).toBe(0);
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
    expect(shared.markers[0].title).toBe("Walk");
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

    expect(shared.setSelectedActivity).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", dayId: "d1" })
    );
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
    expect(shared.setSelectedActivity).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", dayId: "d1" })
    );
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
    expect(shared.markers[1].title).toBe("A2");
  });
});
