"use client";

import { useState } from "react";
import { Check, ChevronDown } from "@/ui/components/icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@/ui/components/popover";
import { cn } from "@/ui/utils/cn";

export type SelectMenuOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SelectMenuProps<T extends string> = {
  value: T;
  options: ReadonlyArray<SelectMenuOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
};

export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select",
  ariaLabel,
  triggerClassName,
  contentClassName,
  align = "start",
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTriggerButton
        className={cn(
          "border-border bg-background text-foreground inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          triggerClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}>
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
      </PopoverTriggerButton>
      <PopoverContent side="bottom" align={align} sideOffset={6} className={cn("p-1", contentClassName)}>
        <div role="listbox" className="space-y-1">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                className={cn(
                  "hover:bg-muted/60 inline-flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm transition-colors focus-visible:bg-muted/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                  isSelected ? "bg-muted/60 text-foreground" : "text-muted-foreground"
                )}
                onClick={() => {
                  if (option.disabled) {
                    return;
                  }
                  onChange(option.value);
                  setOpen(false);
                }}>
                <span>{option.label}</span>
                {isSelected ? <Check className="text-primary size-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
