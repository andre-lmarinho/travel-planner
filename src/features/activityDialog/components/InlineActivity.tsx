"use client";

import type React from "react";
import { memo, useCallback, useMemo, useRef, useState } from "react";

import { ACTIVITY_COPY, getDefaultColor } from "@/features/activity/constants";
import type { Activity } from "@/features/activity/types";
import { ActivitySearchInput } from "@/features/search/components/ActivitySearchInput";
import { useActivitySuggestions } from "@/features/search/hooks/useActivitySuggestions";
import type { ActivitySuggestion, PlaceSelection } from "@/features/search/types";
import { Button } from "@/ui/components/button";
import { cn } from "@/ui/utils/cn";

import { useInlineAutoFocus } from "../hooks/useInlineAutoFocus";
import { useInlineOutsideSubmit } from "../hooks/useInlineOutsideSubmit";
import { useSuggestionSelect } from "../hooks/useSuggestionSelect";
import type { InlineActivityProps } from "../types";

export const InlineActivity = memo(function InlineActivity({
  dayId,
  insertIndex,
  onSubmit,
  onClose,
  onAdvanceInline,
  className,
}: InlineActivityProps) {
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const containerRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outsideSubmitRef = useRef(false);

  const copy = ACTIVITY_COPY.inlineAdd;

  const focusInput = useInlineAutoFocus(inputRef);

  const finalizeInlineActivity = useCallback(() => {
    setTitle("");
    setTouched(false);
    onAdvanceInline?.(insertIndex + 1);
    requestAnimationFrame(focusInput);
  }, [focusInput, insertIndex, onAdvanceInline]);

  const isInvalid = useMemo(() => {
    return touched && title.trim().length === 0;
  }, [touched, title]);

  const trySubmit = useCallback(
    async (overrideTitle?: string): Promise<Activity | null> => {
      setTouched(true);
      const trimmedTitle = (overrideTitle ?? title).trim();
      if (trimmedTitle.length === 0) {
        setError(null);
        focusInput();
        return null;
      }

      try {
        setError(null);
        setIsPending(true);
        const result = await onSubmit(trimmedTitle);
        return result;
      } catch (err) {
        console.error(err);
        setError(copy.errorGeneric);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [focusInput, onSubmit, title]
  );

  const { handleSuggestionSelect } = useSuggestionSelect({
    onSuggestionProcessed: async (patch) => {
      const patchTitle = patch.title?.trim();
      if (!patchTitle) {
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }

      // Set title and call onSubmit for InlineActivity
      setTitle(patchTitle);
      setTouched(false);
      setError(null);

      const activity = await onSubmit(patchTitle, {
        address: patch.address,
        latitude: patch.latitude,
        longitude: patch.longitude,
        description: patch.description,
        imageUrl: patch.imageUrl,
      });

      if (!activity) {
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }

      finalizeInlineActivity();
    },
  });

  const handleTitleChange = useCallback(
    (value: string | PlaceSelection<ActivitySuggestion>) => {
      if (typeof value === "string") {
        setTitle(value);
        if (value.trim().length > 0) {
          setTouched(false);
          setError(null);
        }
        return;
      }
      void handleSuggestionSelect(value);
    },
    [handleSuggestionSelect]
  );

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isPending || isComposing) {
        return;
      }

      const nativeEvent = event.nativeEvent as Event & { submitter?: EventTarget | null };
      const submitter = nativeEvent.submitter ?? null;
      const shouldClose = submitter instanceof HTMLElement && submitter.dataset.close === "true";

      const activity = await trySubmit();
      if (activity) {
        if (shouldClose) {
          onClose();
        } else {
          finalizeInlineActivity();
        }
      }
    },
    [finalizeInlineActivity, isComposing, isPending, onClose, trySubmit]
  );

  const handleOutsideSubmit = useCallback(() => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      onClose();
      return;
    }
    if (isPending || outsideSubmitRef.current) {
      return;
    }

    outsideSubmitRef.current = true;
    void trySubmit()
      .then((activity) => {
        if (activity) {
          onClose();
        }
      })
      .finally(() => {
        outsideSubmitRef.current = false;
      });
  }, [isPending, onClose, title, trySubmit]);

  useInlineOutsideSubmit({ containerRef, handleSubmit: handleOutsideSubmit });

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (isComposing) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [isComposing, onClose]
  );

  return (
    <form ref={containerRef} className={cn("space-y-2", className)} onSubmit={handleFormSubmit}>
      <div className={cn(getDefaultColor("bg"), getDefaultColor("border"), "rounded-lg border border-b-3")}>
        <fieldset className="relative m-0 border-0 p-0" data-no-dnd>
          <legend className="sr-only">{copy.a11yGroupLabel}</legend>
          <ActivitySearchInput
            id={`inline-add-${dayId}-${insertIndex}`}
            label={copy.placeholderTitle}
            value={title}
            onChange={handleTitleChange}
            placeholder={copy.placeholderTitle}
            inputRef={inputRef}
            inputClassName={cn(
              "focus:ring-primary w-full rounded-lg border px-3 pt-2 pb-1 text-base shadow-sm outline-none focus:ring-2",
              isInvalid ? "border-red-500 focus:ring-red-500" : "border-border"
            )}
            suggestionHook={useActivitySuggestions}
            onInputKeyDown={handleKeyDown}
            inputProps={{
              "data-testid": "planner-inline-add-input",
              autoCapitalize: "sentences",
              autoCorrect: "on",
              autoComplete: "off",
              inputMode: "text",
              enterKeyHint: "done",
              "aria-invalid": isInvalid || undefined,
              "aria-describedby": error ? `inline-add-error-${dayId}-${insertIndex}` : undefined,
              onCompositionStart: () => setIsComposing(true),
              onCompositionEnd: () => setIsComposing(false),
            }}
          />
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true"></button>
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          data-close="true"
          className="hover:bg-primary/90">
          {copy.ctaAdd}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          {copy.ctaCancel}
        </Button>
        {error && (
          <output
            id={`inline-add-error-${dayId}-${insertIndex}`}
            className="text-sm text-red-500"
            aria-live="polite">
            {error}
          </output>
        )}
      </div>
    </form>
  );
});
