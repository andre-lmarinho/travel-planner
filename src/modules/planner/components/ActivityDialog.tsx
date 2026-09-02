"use client";

import Image from "next/image";
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { ACTIVITY_COLORS, ACTIVITY_TEXT } from "@/features/activity/constants";
import { useActivityColors } from "@/features/activity/hooks/useActivityColors";
import type { Activity, DayPlan } from "@/features/activity/types";
import { ActivitySearchInput } from "@/features/search/components/ActivitySearchInput";
import { LocationSearchInput } from "@/features/search/components/LocationSearchInput";
import { useActivitySuggestions } from "@/features/search/hooks/useActivitySuggestions";
import { useAddressAutocomplete } from "@/features/search/hooks/useAddressAutocomplete";
import type { ActivitySuggestion, PlaceSelection } from "@/features/search/types";
import { Button } from "@/ui/components/button";
import { Dialog, DialogContent, DialogHeader } from "@/ui/components/dialog";
import {
  AlignLeft,
  ChevronDown,
  DollarSign,
  Hourglass,
  MapPin,
  Palette,
  Trash2,
  X,
} from "@/ui/components/icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@/ui/components/popover";

interface EditorDialogProps {
  activity: (Activity & { dayId: string }) | null;
  days: DayPlan[];
  onSave: (values: Partial<Activity>) => void;
  onDelete?: () => void;
  onClose: () => void;
  onColorChange?: (color: string) => void;
  onDayChange?: (dayId: string) => void;
  onPositionChange?: (index: number) => void;
  onImageChange?: (url: string) => void;
  destCoords?: { lat: number; lng: number } | null;
  isDemo?: boolean;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export const ActivityDialog = memo(function ActivityDialog({
  activity,
  days,
  onSave,
  onDelete,
  onClose,
  onColorChange,
  onDayChange,
  onPositionChange,
  onImageChange,
  destCoords,
  isDemo,
}: EditorDialogProps) {
  const uploadInputId = useId();
  const [activePopup, setActivePopup] = useState<"color" | "day" | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState(activity?.imageUrl ?? "");
  const [draft, setDraft] = useState<Activity | null>(activity);
  const [originalActivity, setOriginalActivity] = useState<Activity | null>(activity);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { bg } = useActivityColors(draft?.color ?? activity?.color);
  const currentDay = days.find((d) => d.id === activity?.dayId);
  const currentIndex = currentDay?.activities.findIndex((a) => a.id === activity?.id) ?? -1;
  const dayPositions = currentDay ? currentDay.activities.map((_, i) => i) : [];

  const closePopovers = () => setActivePopup(null);

  // ESC key handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (hasChanges && originalActivity) {
          // Revert to original
          setDraft(originalActivity);
          setEditedImageUrl(originalActivity.imageUrl ?? "");
          setHasChanges(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, originalActivity, onClose]);

  const handleColorSelect = (color: string) => {
    setDraft((prev) => (prev ? { ...prev, color } : null));
    onColorChange?.(color);
    setHasChanges(true);
    // Save the color change directly - no need to wait for draft state
    void handleSave({ color });
    closePopovers();
  };

  const handleRemoveImage = () => {
    setEditedImageUrl("");
    onImageChange?.("");
  };

  const handleUploadImage = (file: File) => {
    if (isDemo) return; // demo guard, see DemoGuideDialog
    if (file.size > MAX_FILE_SIZE) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setEditedImageUrl(reader.result);
        onImageChange?.(reader.result);
      }
    };
    reader.onerror = () => {
      console.error("Failed to read image file:", reader.error);
    };
    reader.readAsDataURL(file);
  };

  const handleDraftUpdate = (patch: Partial<Activity>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : null));
    if (patch.imageUrl !== undefined) {
      setEditedImageUrl(patch.imageUrl ?? "");
    }
  };

  const handleSave = useCallback(
    async (values: Partial<Activity>) => {
      setIsSaving(true);
      try {
        // Use values.imageUrl if provided (from autocomplete), otherwise use editedImageUrl (manual changes)
        const finalValues = { ...values };
        if (values.imageUrl === undefined && editedImageUrl) {
          finalValues.imageUrl = editedImageUrl;
        }

        await onSave(finalValues);
        setHasChanges(false);
        // Update original activity after successful save
        if (draft) {
          setOriginalActivity({ ...draft, ...values, imageUrl: editedImageUrl || undefined });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, editedImageUrl, draft]
  );

  if (!activity) return null;

  return (
    <Dialog
      open={Boolean(activity)}
      onOpenChange={(open: boolean) => {
        if (!open && hasChanges) {
          // Save before closing if there are changes
          void handleSave(draft ? { ...draft, imageUrl: editedImageUrl } : {}).then(onClose);
        } else if (!open) {
          onClose();
        }
      }}>
      <DialogContent className="flex w-[95%] max-w-113 flex-col p-0">
        <DialogHeader
          visuallyHidden
          title="Edit Activity"
          description="Edit the selected activity title, schedule position, location, notes, budget, and visual details."
        />

        {/* Header */}
        <div
          className={`group relative rounded-t-lg ${
            editedImageUrl ? "h-32" : ""
          } ${!editedImageUrl && !bg.startsWith("#") ? bg : ""}`}
          style={bg.startsWith("#") ? { backgroundColor: bg } : undefined}>
          {editedImageUrl && (
            <Image
              src={editedImageUrl}
              alt={draft?.title ?? ""}
              className="absolute top-0 left-0 h-full w-full rounded-t-lg object-cover"
              width={400}
              height={200}
            />
          )}
          {editedImageUrl && (
            <button
              type="button"
              className="border-border bg-background text-foreground hover:bg-border absolute right-2 bottom-2 z-20 inline-flex cursor-pointer items-center rounded-md border px-3 py-1 text-xs font-medium transition-colors opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}>
              Remove photo
            </button>
          )}

          {/* Header buttons */}
          <div className="relative z-10 flex items-center justify-between p-2">
            {/* Saving indicator */}
            {isSaving && (
              <div className="text-xs text-muted-foreground absolute -top-6 left-2">Saving...</div>
            )}
            <div className="flex items-center gap-2">
              {/* Day Picker */}
              <Popover
                open={activePopup === "day"}
                onOpenChange={(open) => setActivePopup(open ? "day" : null)}>
                <PopoverTriggerButton className="border-border bg-background text-foreground hover:bg-border inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium transition-colors">
                  {currentDay?.label ?? "Change Day"}
                  <ChevronDown className="size-4" aria-hidden="true" />
                </PopoverTriggerButton>
                <PopoverContent
                  title="Change Day"
                  side="bottom"
                  align="start"
                  sideOffset={8}
                  className="w-72 p-0">
                  <div className="flex gap-2 p-4">
                    <div className="w-[65%]">
                      <label htmlFor="day-select" className="text-xs font-bold">
                        Day
                      </label>
                      <select
                        id="day-select"
                        value={activity.dayId}
                        onChange={(e) => {
                          onDayChange?.(e.target.value);
                          closePopovers();
                        }}
                        className="mt-1 w-full rounded border px-2 py-1 text-sm">
                        {days.map((day) => (
                          <option key={day.id} value={day.id}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-[30%]">
                      <label htmlFor="position-select" className="text-xs font-bold">
                        Position
                      </label>
                      <select
                        id="position-select"
                        value={currentIndex >= 0 ? currentIndex : 0}
                        onChange={(e) => onPositionChange?.(Number(e.target.value))}
                        className="mt-1 w-full rounded border px-2 py-1 text-sm">
                        {dayPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              {/* Delete */}
              {onDelete && (
                <button
                  type="button"
                  title="Delete"
                  onClick={onDelete}
                  className="bg-background text-foreground hover:bg-border hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors">
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Delete</span>
                </button>
              )}

              {/* Color Picker */}
              <Popover
                open={activePopup === "color"}
                onOpenChange={(open) => setActivePopup(open ? "color" : null)}>
                <PopoverTriggerButton
                  title="Card Color"
                  className="bg-background text-foreground hover:bg-border hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors">
                  <Palette className="size-4" aria-hidden="true" />
                  <span className="sr-only">Card color</span>
                </PopoverTriggerButton>
                <PopoverContent
                  title="Card Background"
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="w-76 p-0">
                  <div className="space-y-3 p-4">
                    {editedImageUrl && (
                      <button
                        type="button"
                        className="border-border bg-background text-foreground hover:bg-muted/60 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                        onClick={handleRemoveImage}>
                        Remove photo
                      </button>
                    )}

                    <div>
                      <span className="text-xs font-bold">Colors</span>
                      <div className="mt-2 flex flex-wrap justify-between gap-2">
                        {ACTIVITY_COLORS.map((color) => (
                          <button
                            key={color.bg}
                            onClick={() => handleColorSelect(color.bg)}
                            className={`h-10 w-[31%] rounded border-2 shadow-xl ${
                              color.bg.startsWith("#") ? "" : color.bg
                            } ${(draft?.color ?? activity.color) === color.bg ? "ring-primary ring-2" : "border-background"}`}
                            style={color.bg.startsWith("#") ? { backgroundColor: color.bg } : undefined}
                            aria-label={color.name}
                            type="button"
                          />
                        ))}
                      </div>
                    </div>
                    <hr />
                    {!isDemo && (
                      <div>
                        <label
                          htmlFor={uploadInputId}
                          className="border-border bg-background text-foreground hover:bg-muted/60 inline-flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors">
                          Upload image
                        </label>
                        <input
                          id={uploadInputId}
                          name={uploadInputId}
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadImage(file);
                              e.target.value = "";
                            }
                          }}
                          className="sr-only"
                        />
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Close */}
              <button
                type="button"
                title="Close"
                onClick={onClose}
                className="bg-background text-foreground hover:bg-border hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors">
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <ActivityForm
          key={(draft ?? activity)?.id}
          activity={draft ?? activity}
          color={draft?.color ?? activity.color}
          onSave={handleSave}
          onSelectSuggestion={handleDraftUpdate}
          onFieldChange={setHasChanges}
          destCoords={destCoords}
          onDone={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
});

export interface ActivityFormProps {
  activity: Activity;
  color: string;
  onSave: (values: Partial<Activity>) => void | Promise<void>;
  onSelectSuggestion?: (patch: Partial<Activity>) => void;
  onFieldChange?: (hasChanges: boolean) => void;
  onDone?: () => void;
  onCancel?: () => void;
  destCoords?: { lat: number; lng: number } | null;
}

const ActivityForm = memo(function ActivityForm({
  activity,
  color,
  onSave,
  onSelectSuggestion,
  onFieldChange,
  onDone,
  onCancel,
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

  const handleDone = useCallback(async () => {
    await handleFieldBlur();
    onDone?.();
  }, [handleFieldBlur, onDone]);

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
      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void handleDone()}>
          Done
        </Button>
      </div>
    </>
  );
});

function getShortTitle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const commaIndex = trimmed.indexOf(",");
  if (commaIndex > 0 && commaIndex < trimmed.length / 2) {
    return trimmed.substring(0, commaIndex).trim();
  }
  return trimmed;
}

interface UseSuggestionSelectOptions {
  onSelectSuggestion?: (patch: Partial<Activity>) => void;
}

export interface SuggestionData {
  title: string;
  address: string | undefined;
  latitude: number | undefined;
  longitude: number | undefined;
  description: string | undefined;
  imageUrl: string | undefined;
}

function useSuggestionSelect({ onSelectSuggestion }: UseSuggestionSelectOptions) {
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const handleSuggestionSelect = useCallback(
    async (selection: PlaceSelection<ActivitySuggestion>): Promise<SuggestionData | null> => {
      // Cancel any in-flight request from a previous selection
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const suggestion: ActivitySuggestion =
        selection.raw ??
        ({
          placeId: selection.placeId ?? "",
          name: selection.name,
          formatted: selection.formatted ?? selection.name,
          addressLine1: undefined,
          addressLine2: undefined,
          latitude: selection.latitude,
          longitude: selection.longitude,
          resultType: undefined,
          category: selection.category,
          description: selection.description,
        } satisfies ActivitySuggestion);

      const rawTitle =
        selection.raw?.name ??
        suggestion.name ??
        selection.name ??
        selection.raw?.addressLine1 ??
        suggestion.addressLine1 ??
        selection.formatted ??
        suggestion.formatted ??
        "";
      const selectedTitle = getShortTitle(rawTitle) || selection.name;

      let selectedAddress = selection.formatted ?? suggestion.formatted;
      let selectedDescription = selection.description ?? suggestion.description;
      let selectedImageUrl: string | undefined;

      const placeId = selection.placeId ?? suggestion.placeId;

      if (placeId) {
        try {
          const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, {
            signal: controller.signal,
          });
          if (controller.signal.aborted) return null;
          if (response.ok) {
            const body = (await response.json()) as {
              details?: { formatted?: string; description?: string };
              wikidataImageUrl?: string;
            };
            if (body.details?.formatted) {
              selectedAddress = body.details.formatted;
            }
            if (body.details?.description) {
              selectedDescription = body.details.description;
            }
            selectedImageUrl = body.wikidataImageUrl ?? undefined;
          }
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return null;
          console.error("Failed to fetch place details:", { placeId, error });
        }
      }

      if (controller.signal.aborted) return null;

      const suggestionData = {
        title: selectedTitle,
        address: selectedAddress,
        latitude: selection.latitude,
        longitude: selection.longitude,
        description: selectedDescription,
        imageUrl: selectedImageUrl,
      };

      // Call onSelectSuggestion callback if provided (for ActivityForm)
      if (onSelectSuggestion) {
        onSelectSuggestion(suggestionData);
      }

      return suggestionData;
    },
    [onSelectSuggestion]
  );

  return { handleSuggestionSelect };
}
