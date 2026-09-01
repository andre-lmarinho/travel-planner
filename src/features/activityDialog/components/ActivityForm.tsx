"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ACTIVITY_TEXT } from "@/features/activity/constants";
import type { Activity } from "@/features/activity/types";
import { ActivitySearchInput } from "@/features/search/components/ActivitySearchInput";
import { LocationSearchInput } from "@/features/search/components/LocationSearchInput";
import { useActivitySuggestions } from "@/features/search/hooks/useActivitySuggestions";
import { useAddressAutocomplete } from "@/features/search/hooks/useAddressAutocomplete";
import type { ActivitySuggestion, PlaceSelection } from "@/features/search/types";
import { AlignLeft, DollarSign, Hourglass, MapPin } from "@/ui/components/icon";

import { useSuggestionSelect } from "../hooks/useSuggestionSelect";

export interface ActivityFormProps {
  activity: Activity;
  color: string;
  onSave: (values: Partial<Activity>) => void | Promise<void>;
  onSelectSuggestion?: (patch: Partial<Activity>) => void;
  onFieldChange?: (hasChanges: boolean) => void;
  destCoords?: { lat: number; lng: number } | null;
}

export const ActivityForm = memo(function ActivityForm({
  activity,
  color,
  onSave,
  onSelectSuggestion,
  onFieldChange,
  destCoords,
}: ActivityFormProps) {
  const [editedTitle, setEditedTitle] = useState(activity.title ?? "");
  const [editedDescription, setEditedDescription] = useState(activity.description ?? "");
  const [duration, setDuration] = useState<number>(activity.duration || 0);
  const [budget, setBudget] = useState<number>(activity.budget || 0);
  const [address, setAddress] = useState(activity.address ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(activity.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(activity.longitude);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const initialTitle = useRef(editedTitle);

  // Update internal state when activity prop changes
  useEffect(() => {
    setEditedTitle(activity.title ?? "");
    setEditedDescription(activity.description ?? "");
    setDuration(activity.duration || 0);
    setBudget(activity.budget || 0);
    setAddress(activity.address ?? "");
    setLatitude(activity.latitude);
    setLongitude(activity.longitude);
  }, [activity]);

  // Calculate hasChanges during render
  const hasChangesCalculated = useMemo(() => {
    return (
      editedTitle !== activity.title ||
      editedDescription !== activity.description ||
      duration !== activity.duration ||
      budget !== activity.budget ||
      address !== activity.address ||
      latitude !== activity.latitude ||
      longitude !== activity.longitude
    );
  }, [
    editedTitle,
    editedDescription,
    duration,
    budget,
    address,
    latitude,
    longitude,
    activity.title,
    activity.description,
    activity.duration,
    activity.budget,
    activity.address,
    activity.latitude,
    activity.longitude,
  ]);

  // Notify parent when changes status changes
  useEffect(() => {
    onFieldChange?.(hasChangesCalculated);
  }, [hasChangesCalculated, onFieldChange]);

  // Automatically scroll to the title input only once when the initial title is empty
  useEffect(() => {
    if (!initialTitle.current.trim()) {
      titleInputRef.current?.scrollIntoView({ block: "center" });
    }
  }, []);

  const { handleSuggestionSelect: handleSuggestionSelectWithDetails } = useSuggestionSelect({
    onSelectSuggestion: async (patch) => {
      setEditedTitle(patch.title ?? "");
      setAddress(patch.address ?? "");
      setLatitude(patch.latitude);
      setLongitude(patch.longitude);
      setEditedDescription(patch.description ?? "");

      // Auto-save all fields after suggestion selection to persist all autocomplete data
      await onSave({
        title: patch.title ?? "",
        address: patch.address ?? "",
        latitude: patch.latitude,
        longitude: patch.longitude,
        description: patch.description ?? "",
        imageUrl: patch.imageUrl,
        color,
        duration: Number(duration),
        budget,
      });

      onSelectSuggestion?.(patch);
    },
  });

  const handleTitleChange = (value: string | PlaceSelection<ActivitySuggestion>) => {
    if (typeof value === "string") {
      setEditedTitle(value);
      return;
    }
    void handleSuggestionSelectWithDetails(value);
  };

  const handleFieldBlur = useCallback(async () => {
    if (!hasChangesCalculated) return;

    await onSave({
      title: editedTitle.trim(),
      description: editedDescription,
      color,
      duration: Number(duration),
      budget,
      imageUrl: activity.imageUrl,
      address: address.trim() || undefined,
      latitude,
      longitude,
    });
  }, [
    hasChangesCalculated,
    onSave,
    editedTitle,
    editedDescription,
    color,
    duration,
    budget,
    activity.imageUrl,
    address,
    latitude,
    longitude,
  ]);

  return (
    <>
      {/* Editable title with Geoapify search */}
      <div className="relative m-4">
        <ActivitySearchInput
          id="title"
          label="Title"
          value={editedTitle}
          onChange={handleTitleChange}
          placeholder={ACTIVITY_TEXT.emptyTitle}
          latitude={destCoords?.lat}
          longitude={destCoords?.lng}
          suggestionHook={useActivitySuggestions}
          inputRef={titleInputRef}
          inputClassName="focus:ring-primary w-full content-center rounded px-2 py-2 text-2xl font-bold focus:ring-2 focus:ring-offset-2 focus:outline-none"
          onInputBlur={() => handleFieldBlur()}
          inputProps={{ name: "title", required: true, "aria-required": true }}
        />
      </div>

      {/* Duration & Budget group */}
      <fieldset className="mb-4 flex gap-2 px-4" aria-labelledby="time-budget-legend">
        <legend id="time-budget-legend" className="sr-only">
          Duration and Budget
        </legend>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="mb-1 flex items-center gap-1 text-xs font-bold">
            <Hourglass size={12} aria-hidden="true" />
            <span>Duration</span>
          </label>
          <input
            id="duration"
            value={duration === 0 ? "" : String(duration)}
            onChange={(event) => setDuration(Number(event.target.value))}
            onBlur={() => handleFieldBlur()}
            aria-label="Duration in hours"
            type="number"
            placeholder="Hrs"
            className="focus:ring-primary w-22 rounded border px-2 py-1 text-right text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
            autoComplete="off"
            min={0}
            inputMode="decimal"
          />
        </div>
        {/* Budget */}
        <div>
          <label htmlFor="budget" className="mb-1 flex items-center gap-1 text-xs font-bold">
            <DollarSign size={12} aria-hidden="true" />
            <span>Budget</span>
          </label>
          <input
            id="budget"
            value={budget === 0 ? "" : String(budget)}
            onChange={(event) => setBudget(Number(event.target.value))}
            onBlur={() => handleFieldBlur()}
            aria-label="Budget amount"
            type="number"
            placeholder="Budget"
            className="focus:ring-primary w-22 rounded border px-2 py-1 text-right text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
            min={0}
            autoComplete="off"
            inputMode="decimal"
          />
        </div>
      </fieldset>

      {/* Location with Geoapify search */}
      <div className="mb-2 px-4">
        <label htmlFor="activity-address" className="mb-1 flex items-center gap-1 text-xs font-bold">
          <MapPin size={12} aria-hidden="true" />
          <span>Address</span>
        </label>
        <LocationSearchInput
          id="activity-address"
          value={address}
          onChange={(val) => {
            if (typeof val === "string") {
              setAddress(val);
              setLatitude(undefined);
              setLongitude(undefined);
            } else {
              setAddress(val.name);
              setLatitude(val.latitude);
              setLongitude(val.longitude);
            }
          }}
          onBlur={() => handleFieldBlur()}
          placeholder="Search address"
          className="w-full"
          inputClassName="focus:ring-primary w-full rounded p-1 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
          latitude={destCoords?.lat}
          longitude={destCoords?.lng}
          autocompleteHook={useAddressAutocomplete}
        />
      </div>

      {/* Notes */}
      <div className="mb-2 px-4">
        <label htmlFor="activity-notes" className="mb-1 flex items-center gap-1 text-xs font-bold">
          <AlignLeft size={12} aria-hidden="true" />
          <span>Notes</span>
        </label>
        <textarea
          id="activity-notes"
          name="notes"
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          onBlur={() => handleFieldBlur()}
          placeholder="Add a more detailed description."
          rows={3}
          className="focus:ring-primary w-full resize-none rounded p-1 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
        />
      </div>
    </>
  );
});
