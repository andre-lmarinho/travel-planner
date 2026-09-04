"use client";

import { useEffect, useState } from "react";

export function useDestinationCoordinates(destination?: string) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    setCoordinates(null);
    if (!destination) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const params = new URLSearchParams({ text: destination });
        const response = await fetch(`/api/places/city-country?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as {
          results?: Array<{ latitude?: number; longitude?: number }>;
        };
        const first = data.results?.[0];
        if (!controller.signal.aborted && first?.latitude != null && first.longitude != null) {
          setCoordinates({ lat: first.latitude, lng: first.longitude });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Destination coordinates lookup failed", {
            operation: "destinationCoordinates",
            destination,
            error,
          });
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [destination]);
  return coordinates;
}
