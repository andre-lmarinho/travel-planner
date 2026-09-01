"use client";

import React from "react";

import { Spinner } from "@/ui/components/loading";
import { cn } from "@/ui/utils/cn";

export interface SuggestionOption<T> {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  value: T;
}

interface SuggestionComboboxBaseProps<T> {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInputChange: (value: string) => void;
  options: SuggestionOption<T>[];
  loading?: boolean;
  error?: string | boolean;
  emptyMessage?: string;
  className?: string;
  inputClassName?: string;
  renderOption?: (option: SuggestionOption<T>, state: { active: boolean }) => React.ReactNode;
  onInputFocus?: () => void;
  onInputBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onInputKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "role" | "aria-expanded" | "aria-controls" | "aria-activedescendant"
  > & {
    [key: string]: unknown;
  };
}

interface SuggestionComboboxPropsWithMap<T, TSelection> extends SuggestionComboboxBaseProps<T> {
  mapOptionToSelection: (option: SuggestionOption<T>) => TSelection;
  onSelect: (selection: TSelection, option: SuggestionOption<T>) => void;
}

interface SuggestionComboboxPropsWithoutMap<T> extends SuggestionComboboxBaseProps<T> {
  mapOptionToSelection?: undefined;
  onSelect: (selection: T, option: SuggestionOption<T>) => void;
}

type SuggestionComboboxProps<T, TSelection = T> =
  | SuggestionComboboxPropsWithMap<T, TSelection>
  | SuggestionComboboxPropsWithoutMap<T>;

export function SuggestionCombobox<T, TSelection = T>(props: SuggestionComboboxProps<T, TSelection>) {
  const {
    id,
    label,
    placeholder,
    value,
    open,
    onOpenChange,
    onInputChange,
    options,
    loading,
    error,
    emptyMessage,
    className,
    inputClassName,
    renderOption,
    onInputFocus,
    onInputBlur,
    onInputKeyDown,
    inputRef,
    inputProps,
  } = props;
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-suggestions`;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  React.useEffect(() => {
    setActiveIndex((prev) => {
      if (options.length === 0) return -1;
      return Math.min(prev, options.length - 1);
    });
  }, [options.length]);

  const handleSelect = (option: SuggestionOption<T>) => {
    if (props.mapOptionToSelection) {
      const selection = props.mapOptionToSelection(option);
      props.onSelect(selection, option);
    } else {
      props.onSelect(option.value, option);
    }
    onOpenChange(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(event.target.value);
    setActiveIndex(-1);
    onOpenChange(true);
  };

  const handleInputFocus = () => {
    onOpenChange(true);
    onInputFocus?.();
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onInputBlur?.(event);
    const related = event.relatedTarget as Node | null;
    if (related && containerRef.current?.contains(related)) {
      return;
    }
    onOpenChange(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      onOpenChange(true);
      setActiveIndex((idx) => (idx + 1) % options.length);
    } else if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      onOpenChange(true);
      setActiveIndex((idx) => (idx - 1 + options.length) % options.length);
    } else if ((event.key === "Enter" || event.key === "Tab") && open && options.length > 0) {
      const idx = activeIndex >= 0 ? activeIndex : 0;
      const option = options[idx];
      if (option) {
        event.preventDefault();
        handleSelect(option);
      }
    }

    onInputKeyDown?.(event);
  };

  const defaultInputClassName =
    inputClassName ??
    "bg-background focus:ring-primary flex w-full items-center justify-between space-x-4 rounded-md border px-4 py-2 text-sm transition focus:ring-2 focus:outline-none";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label ? (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          {...inputProps}
          id={inputId}
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 && options[activeIndex]
              ? `${listId}-option-${options[activeIndex].id}`
              : undefined
          }
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={defaultInputClassName}
          autoComplete="off"
        />
        {loading ? (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <Spinner className="size-4" label="Loading suggestions" />
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="text-destructive mt-1 text-sm" role="alert" aria-live="assertive">
          {typeof error === "string" ? error : "Failed to load suggestions."}
        </p>
      ) : null}
      {open && !error ? (
        options.length > 0 ? (
          <div
            id={listId}
            role="listbox"
            className="bg-background absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border text-sm shadow">
            {options.map((option, idx) => (
              <button
                key={option.id}
                id={`${listId}-option-${option.id}`}
                role="option"
                aria-selected={activeIndex === idx}
                tabIndex={-1}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left transition",
                  activeIndex === idx ? "bg-accent" : "hover:bg-accent"
                )}
                onMouseDown={() => handleSelect(option)}>
                {renderOption ? (
                  renderOption(option, { active: activeIndex === idx })
                ) : (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                    {option.description ? (
                      <span className="text-muted-foreground text-xs">{option.description}</span>
                    ) : null}
                    {option.meta ? (
                      <span className="text-muted-foreground text-[11px] uppercase tracking-[0.08em]">
                        {option.meta}
                      </span>
                    ) : null}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : !loading && emptyMessage ? (
          <output
            className="bg-background text-muted-foreground absolute z-10 mt-1 block w-full rounded border px-3 py-2 text-sm shadow"
            aria-live="polite">
            {emptyMessage}
          </output>
        ) : null
      ) : null}
    </div>
  );
}
