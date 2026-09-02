"use client";

import dynamic from "next/dynamic";

import type { TravelCountry } from "@/modules/user/components/DestinationsMap";
import { MapPin } from "@/ui/components/icon";

const DestinationsMap = dynamic(
  () => import("@/modules/user/components/DestinationsMap").then((m) => m.DestinationsMap),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-full w-full animate-pulse" />,
  }
);

export function DashboardMap({ countries }: { countries: TravelCountry[] }) {
  return (
    <div className="border-border bg-card relative isolate h-75 w-full overflow-hidden rounded-xl border shadow-sm md:h-105">
      {countries.length > 0 ? (
        <DestinationsMap countries={countries} />
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
