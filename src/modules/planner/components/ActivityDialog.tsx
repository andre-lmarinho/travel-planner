"use client";

import Image from "next/image";
import { memo, useEffect, useId, useRef, useState } from "react";

import { ACTIVITY_COLORS, ACTIVITY_TEXT } from "@/features/activity/constants";
import { useActivityColors } from "@/features/activity/hooks/useActivityColors";
import type { Activity, DayPlan } from "@/features/activity/types";
import { ActivitySearchInput } from "@/features/search/components/ActivitySearchInput";
import { LocationSearchInput } from "@/features/search/components/LocationSearchInput";
import { useActivitySuggestions } from "@/features/search/hooks/useActivitySuggestions";
import { useAddressAutocomplete } from "@/features/search/hooks/useAddressAutocomplete";
import { usePlaceSelection } from "@/features/search/hooks/usePlaceSelection";
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
  onDayChange?: (dayId: string) => void;
  onPositionChange?: (index: number) => void;
  destCoords?: { lat: number; lng: number } | null;
  isDemo?: boolean;
}

type ActivityDraft = Pick<Activity, "title" | "color" | "latitude" | "longitude"> & {
  description: string;
  address: string;
  imageUrl: string;
  duration: string;
  budget: string;
};

function createDraft(activity: Activity | null): ActivityDraft {
  return {
    title: activity?.title ?? "",
    color: activity?.color ?? "",
    latitude: activity?.latitude,
    longitude: activity?.longitude,
    description: activity?.description ?? "",
    address: activity?.address ?? "",
    imageUrl: activity?.imageUrl ?? "",
    duration: activity?.duration ? String(activity.duration) : "",
    budget: activity?.budget ? String(activity.budget) : "",
  };
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export const ActivityDialog = memo(function ActivityDialog({
  activity,
  days,
  onSave,
  onDelete,
  onClose,
  onDayChange,
  onPositionChange,
  destCoords,
  isDemo,
}: EditorDialogProps) {
  const uploadInputId = useId();
  const [activePopup, setActivePopup] = useState<"color" | "day" | null>(null);
  const [draft, setDraft] = useState(() => createDraft(activity));
  const lastSubmitted = useRef(draft);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const initialTitle = useRef(draft.title);
  useEffect(() => {
    if (!initialTitle.current.trim()) titleInputRef.current?.scrollIntoView({ block: "center" });
  }, []);
  const { selectPlace, cancelSelection } = usePlaceSelection();
  const { bg } = useActivityColors(draft.color);
  const currentDay = days.find((d) => d.id === activity?.dayId);
  const currentIndex = currentDay?.activities.findIndex((a) => a.id === activity?.id) ?? -1;
  const dayPositions = currentDay ? currentDay.activities.map((_, i) => i) : [];
  const closePopovers = () => setActivePopup(null);
  const updateDraft = (patch: Partial<ActivityDraft>) => {
    cancelSelection();
    setDraft((previous) => ({ ...previous, ...patch }));
  };

  // Submission updates the optimistic document; collaboration owns persistence.
  const commit = (next = draft) => {
    const values = { ...next, title: next.title.trim(), address: next.address.trim() };
    setDraft(values);
    if (JSON.stringify(values) === JSON.stringify(lastSubmitted.current)) return;
    onSave({ ...values, duration: Number(values.duration), budget: Number(values.budget) });
    lastSubmitted.current = values;
  };
  const commitAndClose = () => {
    cancelSelection();
    commit();
    onClose();
  };
  const revert = () => {
    cancelSelection();
    setDraft(lastSubmitted.current);
  };
  const handleColorSelect = (color: string) => {
    cancelSelection();
    commit({ ...draft, color });
    closePopovers();
  };
  const handleRemoveImage = () => {
    cancelSelection();
    commit({ ...draft, imageUrl: "" });
  };
  const handleUploadImage = (file: File) => {
    if (isDemo || file.size > MAX_FILE_SIZE) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") updateDraft({ imageUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };
  const handleTitleChange = async (value: string | PlaceSelection<ActivitySuggestion>) => {
    if (typeof value === "string") {
      updateDraft({ title: value });
      return;
    }
    const place = await selectPlace(value);
    if (!place) return;
    const next = {
      ...draft,
      ...place,
      description: place.description ?? "",
      address: place.address ?? "",
      imageUrl: place.imageUrl ?? draft.imageUrl,
    };
    commit(next);
  };

  if (!activity) return null;

  return (
    <Dialog
      open={Boolean(activity)}
      onOpenChange={(open, details) => {
        if (open) return;
        if (details.reason === "escape-key") {
          if (JSON.stringify(draft) !== JSON.stringify(lastSubmitted.current)) revert();
          else onClose();
          return;
        }
        commitAndClose();
      }}>
      <DialogContent className="flex w-[95%] max-w-113 flex-col p-0">
        <DialogHeader
          visuallyHidden
          title="Edit Activity"
          description="Edit the selected activity title, schedule position, location, notes, budget, and visual details."
        />

        <div
          className={`group relative rounded-t-lg ${
            draft.imageUrl ? "h-32" : ""
          } ${!draft.imageUrl && !bg.startsWith("#") ? bg : ""}`}
          style={bg.startsWith("#") ? { backgroundColor: bg } : undefined}>
          {draft.imageUrl && (
            <Image
              src={draft.imageUrl}
              alt={draft.title}
              className="absolute top-0 left-0 h-full w-full rounded-t-lg object-cover"
              width={400}
              height={200}
            />
          )}
          {draft.imageUrl && (
            <Button
              variant="ghost"
              className="border-border hover:bg-border absolute right-2 bottom-2 z-20 border py-1 text-xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
              onClick={handleRemoveImage}>
              Remove photo
            </Button>
          )}

          <div className="relative z-10 flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
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
              {onDelete && (
                <Button
                  variant="ghost"
                  title="Delete"
                  aria-label="Delete"
                  onClick={onDelete}
                  className="hover:bg-border size-8 rounded-full p-0">
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              )}

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
                    {draft.imageUrl && (
                      <Button
                        variant="ghost"
                        className="border-border hover:bg-muted/60 border"
                        onClick={handleRemoveImage}>
                        Remove photo
                      </Button>
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
                            } ${draft.color === color.bg ? "ring-primary ring-2" : "border-background"}`}
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

              <Button
                variant="ghost"
                title="Close"
                aria-label="Close"
                onClick={commitAndClose}
                className="hover:bg-border size-8 rounded-full p-0">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative m-4">
          <ActivitySearchInput
            id="title"
            label="Title"
            value={draft.title}
            onChange={handleTitleChange}
            placeholder={ACTIVITY_TEXT.emptyTitle}
            latitude={destCoords?.lat}
            longitude={destCoords?.lng}
            suggestionHook={useActivitySuggestions}
            inputRef={titleInputRef}
            inputClassName="focus:ring-primary w-full content-center rounded px-2 py-2 text-2xl font-bold focus:ring-2 focus:ring-offset-2 focus:outline-none"
            onInputBlur={() => commit()}
            inputProps={{ name: "title", required: true, "aria-required": true }}
          />
        </div>

        <fieldset className="mb-4 flex gap-2 px-4" aria-labelledby="time-budget-legend">
          <legend id="time-budget-legend" className="sr-only">
            Duration and Budget
          </legend>

          {(
            [
              ["duration", "Duration", "Duration in hours", "Hrs", Hourglass],
              ["budget", "Budget", "Budget amount", "Budget", DollarSign],
            ] as const
          ).map(([field, label, accessibleLabel, placeholder, Icon]) => (
            <div key={field}>
              <label htmlFor={field} className="mb-1 flex items-center gap-1 text-xs font-bold">
                <Icon size={12} aria-hidden="true" />
                <span>{label}</span>
              </label>
              <input
                id={field}
                value={draft[field]}
                onChange={(event) => updateDraft({ [field]: event.target.value })}
                onBlur={() => commit()}
                aria-label={accessibleLabel}
                type="number"
                placeholder={placeholder}
                className="focus:ring-primary w-22 rounded border px-2 py-1 text-right text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                autoComplete="off"
                min={0}
                step="any"
                inputMode="decimal"
              />
            </div>
          ))}
        </fieldset>

        <div className="mb-2 px-4">
          <label htmlFor="activity-address" className="mb-1 flex items-center gap-1 text-xs font-bold">
            <MapPin size={12} aria-hidden="true" />
            <span>Address</span>
          </label>
          <LocationSearchInput
            id="activity-address"
            value={draft.address}
            onChange={(val) => {
              if (typeof val === "string") {
                updateDraft({ address: val, latitude: undefined, longitude: undefined });
              } else {
                updateDraft({ address: val.name, latitude: val.latitude, longitude: val.longitude });
              }
            }}
            onBlur={() => commit()}
            placeholder="Search address"
            className="w-full"
            inputClassName="focus:ring-primary w-full rounded p-1 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
            latitude={destCoords?.lat}
            longitude={destCoords?.lng}
            autocompleteHook={useAddressAutocomplete}
          />
        </div>

        <div className="mb-2 px-4">
          <label htmlFor="activity-notes" className="mb-1 flex items-center gap-1 text-xs font-bold">
            <AlignLeft size={12} aria-hidden="true" />
            <span>Notes</span>
          </label>
          <textarea
            id="activity-notes"
            name="notes"
            value={draft.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            onBlur={() => commit()}
            placeholder="Add a more detailed description."
            rows={3}
            className="focus:ring-primary w-full resize-none rounded p-1 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              revert();
              onClose();
            }}>
            Cancel
          </Button>
          <Button type="button" onClick={commitAndClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
