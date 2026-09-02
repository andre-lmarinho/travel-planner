"use client";

import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

import { getDefaultColor } from "@/features/activity/constants";
import { usePlannerContext } from "@/modules/planner/hooks/PlannerContext";
import { tileAttribution, tileUrl } from "@/ui/components/map/geoapifyTiles";
import { cn } from "@/ui/utils/cn";

// Extract the CSS color from a Tailwind class like "bg-[var(--color-X)]"
const getCssColor = (cls?: string): string | undefined => {
  if (!cls) return undefined;
  const m = cls.match(/^bg-\[(.+)\]$/);
  return m ? m[1] : cls;
};

// Fit map view to all markers whenever coordinates change
function FitAllMarkers({ coords }: { coords: LatLngExpression[] }) {
  const map = useMap();
  const prev = useRef<LatLngExpression[] | null>(null);

  useEffect(() => {
    if (coords.length === 0) return;

    const same =
      prev.current &&
      prev.current.length === coords.length &&
      prev.current.every((c, i) => {
        const a = L.latLng(c);
        const b = L.latLng(coords[i]);
        return a.equals(b);
      });

    if (!same) {
      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
      prev.current = coords;
    }
  }, [coords, map]);

  return null;
}

interface MapViewProps {
  className?: string;
}

export const MapView = React.memo(function MapView({ className }: MapViewProps) {
  const { days, setSelectedActivity, destCoords } = usePlannerContext();
  const centerCoords = destCoords ?? undefined;
  const defaultBg = useMemo(() => getCssColor(getDefaultColor()) ?? "var(--color-0)", []);
  const dayPaths = useMemo(
    () =>
      days
        .map((day, dayIdx) => {
          const acts = day.activities.filter((a) => a.latitude != null && a.longitude != null);
          const coords = acts.map((a) => [Number(a.latitude), Number(a.longitude)] as LatLngExpression);
          return { day, dayIdx, coords, acts };
        })
        .filter((d) => d.coords.length > 0),
    [days]
  );

  const allCoords = useMemo(() => dayPaths.flatMap((d) => d.coords), [dayPaths]);
  const center: LatLngExpression = allCoords.length
    ? allCoords[0]
    : centerCoords
      ? [centerCoords.lat, centerCoords.lng]
      : [0, 0];
  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden rounded-xl border",
        className ?? "h-full min-h-[calc(100dvh-12rem)]"
      )}>
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
        aria-label="Itinerary map">
        <FitAllMarkers coords={allCoords} />
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={20} />
        {dayPaths.map(({ day, dayIdx, coords, acts }) => (
          <React.Fragment key={day.id}>
            {coords.map((pos, i) => {
              const act = acts[i];
              const bg = getCssColor(act.color) ?? defaultBg;
              const number = dayIdx + 1;
              const icon = L.divIcon({
                html: `
                  <div style="
                    background: ${bg};
                    color: var(--foreground);
                    width: 32px; height: 32px;
                    border: 2px solid var(--background);
                    border-radius: 50%;
                    line-height: 32px;
                    text-align: center;
                    font-weight: bold;
                    box-shadow: 0 0 4px rgba(0,0,0,0.5);
                  ">${number}</div>
                `,
                className: "",
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              });

              return (
                <Marker
                  key={act.id}
                  position={pos}
                  icon={icon}
                  title={act.title}
                  eventHandlers={{
                    click: () =>
                      setSelectedActivity({
                        ...act,
                        dayId: day.id,
                      }),
                    contextmenu: (e: LeafletMouseEvent) => {
                      e.originalEvent.preventDefault();
                      setSelectedActivity({
                        ...act,
                        dayId: day.id,
                      });
                    },
                  }}
                />
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
