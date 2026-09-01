"use client";

import dynamic from "next/dynamic";

import type { MapPin as MapPinType } from "@/features/mapBoard/DestinationsMap";
import { MapPin } from "@/ui/components/icon";

// react-leaflet touches window on import, so the map is client-only. Fixed height
// reserves space (no CLS) and the skeleton fills it while the chunk loads.
const DestinationsMap = dynamic(
  () => import("@/features/mapBoard/DestinationsMap").then((m) => m.DestinationsMap),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-full w-full animate-pulse" />,
  }
);

export function DashboardMap({ pins }: { pins: MapPinType[] }) {
  return (
    <div className="border-border bg-card relative isolate h-75 w-full overflow-hidden rounded-xl border shadow-sm md:h-105">
      {pins.length > 0 ? (
        <DestinationsMap pins={pins} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <MapPin className="text-muted-foreground h-6 w-6" aria-hidden="true" />
          <p className="text-muted-foreground max-w-xs text-sm">
            Add destinations to your trips and they&apos;ll appear here.
          </p>
        </div>
      )}
    </div>
  );
}
