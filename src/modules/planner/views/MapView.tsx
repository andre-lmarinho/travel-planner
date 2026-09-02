"use client";

import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Tooltip as LeafletTooltip,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";

import { getDefaultColor } from "@/features/activity/constants";
import type { Activity, DayPlan } from "@/features/activity/types";
import { plannerTileUrl, tileAttribution } from "@/ui/components/map/config";
import { cn } from "@/ui/utils/cn";

function getCssColor(cls?: string): string | undefined {
  if (!cls) return undefined;
  const match = cls.match(/^bg-\[(.+)\]$/);
  return match ? match[1] : cls;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function FitAllMarkers({ coords }: { coords: LatLngExpression[] }) {
  const map = useMap();
  const previousCoords = useRef<LatLngExpression[] | null>(null);

  useEffect(() => {
    if (coords.length === 0) return;
    const unchanged =
      previousCoords.current?.length === coords.length &&
      previousCoords.current.every((coord, index) => L.latLng(coord).equals(L.latLng(coords[index])));
    if (!unchanged) {
      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
      previousCoords.current = coords;
    }
  }, [coords, map]);

  return null;
}

interface MapViewProps {
  days: DayPlan[];
  destCoords: { lat: number; lng: number } | null;
  onActivitySelect: (activity: Activity, dayId: string) => void;
  highlightedDayId?: string | null;
  highlightedActivityId?: string | null;
  onDayHover?: (dayId: string | null) => void;
  className?: string;
}

export const MapView = React.memo(function MapView({
  days,
  destCoords,
  onActivitySelect,
  highlightedDayId,
  highlightedActivityId,
  onDayHover,
  className,
}: MapViewProps) {
  const defaultBg = getCssColor(getDefaultColor()) ?? "var(--color-0)";
  const dayPaths = useMemo(
    () =>
      days.flatMap((day, dayIndex) => {
        const activities = day.activities.filter(
          (activity) => activity.latitude != null && activity.longitude != null
        );
        if (activities.length === 0) return [];
        return [
          {
            day,
            dayIndex,
            activities,
            coords: activities.map(
              (activity) => [Number(activity.latitude), Number(activity.longitude)] as [number, number]
            ),
          },
        ];
      }),
    [days]
  );

  const allCoords = dayPaths.flatMap((path) => path.coords);
  const center: LatLngExpression = allCoords[0] ?? (destCoords ? [destCoords.lat, destCoords.lng] : [0, 0]);

  return (
    <div className={cn("relative isolate w-full overflow-hidden rounded-xl border", className ?? "h-full")}>
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        zoomDelta={0.25}
        zoomSnap={0.25}
        wheelDebounceTime={100}
        wheelPxPerZoomLevel={240}
        style={{ width: "100%", height: "100%" }}
        aria-label="Itinerary map">
        <FitAllMarkers coords={allCoords} />
        <ZoomControl position="bottomright" />
        <TileLayer url={plannerTileUrl} attribution={tileAttribution} maxZoom={20} />
        {dayPaths.map(({ day, dayIndex, activities, coords }) => (
          <React.Fragment key={day.id}>
            {coords.map((position, index) => {
              const activity = activities[index];
              const background = getCssColor(activity.color) ?? defaultBg;
              const isDimmed = highlightedActivityId
                ? highlightedActivityId !== activity.id
                : highlightedDayId != null && highlightedDayId !== day.id;
              const image = activity.imageUrl?.trim()
                ? `<img src="${escapeAttribute(activity.imageUrl.trim())}" alt="" style="display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
                : "";
              const icon = L.divIcon({
                html: `<div style="position: relative; width: 40px; height: 40px; opacity: ${isDimmed ? 0.35 : 1}; transform: ${isDimmed ? "scale(0.9)" : "scale(1)"}; transition: opacity 120ms ease, transform 120ms ease; border: 2px solid ${background}; border-radius: 50%; overflow: visible; background: transparent; box-shadow: 0 1px 4px rgba(0,0,0,0.35);"><div style="width: 100%; height: 100%; border-radius: 50%; background: ${background};">${image}</div><span style="position: absolute; right: -3px; bottom: -3px; width: 16px; height: 16px; border: 2px solid var(--card); border-radius: 50%; background: var(--primary); color: var(--primary-foreground); font-size: 9px; line-height: 12px; text-align: center; font-weight: 700;">${dayIndex + 1}</span></div>`,
                className: "",
                iconSize: [40, 40],
                iconAnchor: [20, 20],
              });
              return (
                <Marker
                  key={activity.id}
                  position={position}
                  icon={icon}
                  eventHandlers={{
                    click: () => onActivitySelect(activity, day.id),
                    mouseover: () => onDayHover?.(day.id),
                    mouseout: () => onDayHover?.(null),
                    contextmenu: (event: LeafletMouseEvent) => {
                      event.originalEvent.preventDefault();
                      onActivitySelect(activity, day.id);
                    },
                  }}>
                  <LeafletTooltip direction="top" offset={[0, -16]}>
                    {activity.title.trim() || "Untitled activity"}
                  </LeafletTooltip>
                </Marker>
              );
            })}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
});

MapView.displayName = "MapView";

export default MapView;
