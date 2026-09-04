"use client";

import { useEffect, useRef } from "react";
import type { ActivitySuggestion, PlaceSelection } from "../types";

export function usePlaceSelection() {
  const pending = useRef<AbortController | null>(null);
  const cancelSelection = () => pending.current?.abort();
  useEffect(() => () => pending.current?.abort(), []);

  const selectPlace = async (selection: PlaceSelection<ActivitySuggestion>) => {
    cancelSelection();
    const controller = new AbortController();
    pending.current = controller;
    const raw = selection.raw;
    const name = (raw?.name ?? selection.name).trim();
    const comma = name.indexOf(",");
    const title =
      (comma > 0 && comma < name.length / 2 ? name.slice(0, comma).trim() : name) || selection.name;
    const place = {
      title,
      address: selection.formatted ?? raw?.formatted ?? selection.name,
      description: selection.description ?? raw?.description,
      latitude: selection.latitude,
      longitude: selection.longitude,
      imageUrl: undefined as string | undefined,
    };
    const placeId = selection.placeId ?? raw?.placeId;
    if (placeId) {
      try {
        const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!controller.signal.aborted) {
          const body = (await response.json()) as {
            details?: { formatted?: string; description?: string };
            wikidataImageUrl?: string;
          };
          place.address = body.details?.formatted || place.address;
          place.description = body.details?.description || place.description;
          place.imageUrl = body.wikidataImageUrl;
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Place details lookup failed", { operation: "placeDetails", placeId, error });
        }
      }
    }
    return controller.signal.aborted ? null : place;
  };

  return { selectPlace, cancelSelection };
}
