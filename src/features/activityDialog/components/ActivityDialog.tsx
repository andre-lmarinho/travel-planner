"use client";

import Image from "next/image";
import { memo, useCallback, useEffect, useId, useState } from "react";

import { ACTIVITY_COLORS } from "@/features/activity/constants";
import { useActivityColors } from "@/features/activity/hooks/useActivityColors";
import type { Activity } from "@/features/activity/types";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/shared/ui/dialog";
import { ChevronDown, Palette, Trash2, X } from "@/shared/ui/icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@/shared/ui/popover";

import type { EditorDialogProps } from "../types";
import { ActivityForm } from "./ActivityForm";

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
        />
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
