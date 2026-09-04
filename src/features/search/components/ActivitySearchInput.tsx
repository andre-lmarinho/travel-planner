"use client";

import React from "react";

import type { SuggestionHook } from "@/features/search/hooks/createGeoapifySuggestionHook";
import { useDebounce } from "@/features/search/hooks/useDebounce";
import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/features/search/lib/geoapify/config";
import type { ActivitySuggestion, PlaceSelection } from "@/features/search/types";
import { cn } from "@/ui/utils/cn";

import type { SuggestionOption } from "./SuggestionCombobox";
import { SuggestionCombobox } from "./SuggestionCombobox";

interface ActivitySearchInputProps {
  value: string;
  onChange: (value: string | PlaceSelection<ActivitySuggestion>) => void;
  id?: string;
  placeholder?: string;
  label?: string;
  className?: string;
  inputClassName?: string;
  latitude?: number;
  longitude?: number;
  suggestionHook: SuggestionHook<ActivitySuggestion>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "role" | "aria-expanded" | "aria-controls" | "aria-activedescendant"
  > & {
    [key: string]: unknown;
  };
  onInputFocus?: () => void;
  onInputBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onInputKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function ActivitySearchInput({
  value,
  onChange,
  id = "activity-suggestion-input",
  placeholder = "Search activity",
  label,
  className,
  inputClassName,
  latitude,
  longitude,
  suggestionHook,
  inputRef,
  inputProps,
  onInputFocus,
  onInputBlur,
  onInputKeyDown,
}: ActivitySearchInputProps) {
  const [open, setOpen] = React.useState(false);

  const debounced = useDebounce(value);
  const canSearch = debounced.trim().length >= GEOAPIFY_MIN_QUERY_LENGTH;
  const openState = open && canSearch;

  const { results, loading, error } = suggestionHook(debounced, {
    enabled: openState,
    latitude,
    longitude,
  });

  const options = React.useMemo(() => {
    return results.map(
      (suggestion: ActivitySuggestion, idx: number): SuggestionOption<ActivitySuggestion> => ({
        id: suggestion.placeId ?? `${suggestion.latitude}-${suggestion.longitude}-${idx}`,
        label: suggestion.name,
        description: suggestion.formatted,
        meta: suggestion.category,
        value: suggestion,
      })
    );
  }, [results]);

  const mapOptionToSelection = React.useCallback(
    (option: SuggestionOption<ActivitySuggestion>): PlaceSelection<ActivitySuggestion> => ({
      id: option.id,
      placeId: option.value.placeId,
      name: option.value.name,
      formatted: option.value.formatted,
      description: option.value.description,
      category: option.value.category,
      latitude: option.value.latitude,
      longitude: option.value.longitude,
      raw: option.value,
      source: "activity",
    }),
    []
  );

  return (
    <SuggestionCombobox<ActivitySuggestion, PlaceSelection<ActivitySuggestion>>
      id={id}
      label={label}
      placeholder={placeholder}
      value={value}
      open={openState}
      onOpenChange={setOpen}
      onInputChange={(next) => onChange(next)}
      options={options}
      onSelect={(selection) => onChange(selection)}
      mapOptionToSelection={mapOptionToSelection}
      loading={loading}
      error={error ? "Failed to load suggestions." : undefined}
      emptyMessage="No suggestions found."
      className={className}
      inputClassName={
        inputClassName ??
        "bg-background focus:ring-primary flex w-full items-center justify-between space-x-4 rounded-md border px-4 py-2 text-sm transition focus:ring-2 focus:outline-none"
      }
      renderOption={(option, { active }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-semibold">{option.label}</span>
          {option.description ? (
            <span className="text-muted-foreground text-xs">{option.description}</span>
          ) : null}
          {option.meta ? (
            <span
              className={cn(
                "text-muted-foreground text-[11px] tracking-[0.08em] uppercase",
                active ? "font-semibold" : undefined
              )}>
              {option.meta}
            </span>
          ) : null}
        </div>
      )}
      inputRef={inputRef}
      inputProps={inputProps}
      onInputFocus={onInputFocus}
      onInputBlur={onInputBlur}
      onInputKeyDown={onInputKeyDown}
    />
  );
}
