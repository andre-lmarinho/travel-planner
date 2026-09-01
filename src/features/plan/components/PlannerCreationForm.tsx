"use client";

import { addDays } from "date-fns";
import type { FormEvent } from "react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { LocationSearchInput } from "@/features/search/components/LocationSearchInput";
import { useDestinationAutocomplete } from "@/features/search/hooks/useDestinationAutocomplete";
import type { AutocompletePlace } from "@/features/search/types";
import { trpc } from "@/trpc/react";
import { Button } from "@/ui/components/button/Button";
import { DateRangePicker } from "@/ui/components/calendar/DateRangePicker";
import { LoadingScreen } from "@/ui/components/loading/LoadingScreen";

import type { CreatePlannerPlanResult } from "../services/PlanService";

type PlannerCreationFormProps = {
  onPlanCreated: (plan: CreatePlannerPlanResult) => void;
};

function getDefaultRange(): DateRange {
  return {
    from: new Date(),
    to: addDays(new Date(), 7),
  };
}

export function PlannerCreationForm({ onPlanCreated }: PlannerCreationFormProps) {
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange());
  const [dest, setDest] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCountry, setDestCountry] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const createPlan = trpc.viewer.plan.create.useMutation();
  const loading = createPlan.isPending;

  function handleRangeChange(nextRange: DateRange | undefined) {
    setRange(nextRange);
    if (nextRange?.from && nextRange?.to) {
      setError("");
    }
  }

  function handleDestChange(val: string | AutocompletePlace) {
    if (typeof val === "string") {
      setDest(val);
      setCoords(null);
      setDestCountry(null);
      setPlaceId(null);
    } else {
      setDest(val.name);
      setCoords({ lat: val.latitude, lng: val.longitude });
      setDestCountry(val.countryCode ?? val.country ?? null);
      setPlaceId(val.placeId ?? null);
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!range?.from || !range?.to) {
      setError("Please select your travel dates.");
      return;
    }

    setError("");
    const destParam = dest.trim().split(",")[0];
    if (!destParam) {
      setError("Please choose a destination.");
      return;
    }

    try {
      const planResult = await createPlan.mutateAsync({
        title: destParam,
        destination: {
          name: destParam,
          latitude: coords?.lat,
          longitude: coords?.lng,
          country: destCountry ?? undefined,
          placeId: placeId ?? undefined,
        },
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
        isPublic: false,
      });

      onPlanCreated(planResult);
      setRange(getDefaultRange());
      setDest("");
      setCoords(null);
      setDestCountry(null);
      setPlaceId(null);
    } catch (err) {
      console.error("Failed to create plan", {
        destination: destParam,
        message: err instanceof Error ? err.message : "Unknown error",
      });
      setError("Failed to create plan. Please try again.");
    }
  };

  return (
    <>
      {loading ? <LoadingScreen text="Creating plan..." /> : null}
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <fieldset className="grid gap-2" aria-labelledby="dest-label">
          <legend id="dest-label" className="sr-only">
            Destination
          </legend>
          <LocationSearchInput
            id="dest-input"
            value={dest}
            onChange={handleDestChange}
            placeholder="Destination"
            autocompleteHook={useDestinationAutocomplete}
          />
        </fieldset>

        <fieldset className="grid gap-2" aria-labelledby="daterange-label">
          <legend id="daterange-label" className="sr-only">
            Travel dates
          </legend>

          <DateRangePicker
            value={range}
            onChange={handleRangeChange}
            aria-describedby={error ? "form-error" : undefined}
            aria-invalid={Boolean(error)}
          />
        </fieldset>

        <Button type="submit" disabled={loading} className="w-full">
          Create trip
        </Button>

        {error ? (
          <p id="form-error" role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
      </form>
    </>
  );
}
