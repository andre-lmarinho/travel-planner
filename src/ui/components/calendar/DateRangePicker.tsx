"use client";

import { format } from "date-fns";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Calendar as CalendarIcon } from "@/ui/components/icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@/ui/components/popover";
import { cn } from "@/ui/utils/cn";
import { Calendar } from "./Calendar";

interface Props {
  className?: string;
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
}

export function DateRangePicker({ className, value, onChange, disabled = false }: Props) {
  const [open, setOpen] = React.useState(false);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "LLL dd")} - ${format(value.to, "LLL dd, y")}`
      : format(value.from, "LLL dd, y")
    : "Pick a date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTriggerButton
        className={cn(
          "border-border bg-background text-foreground inline-flex w-full cursor-pointer items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm font-normal transition-colors",
          !value?.from && "text-muted-foreground",
          className
        )}
        aria-label={label}
        disabled={disabled}>
        <span className={cn("flex-1 truncate text-left", !value?.from && "text-muted-foreground italic")}>
          {label}
        </span>
        <CalendarIcon className="text-muted-foreground size-4" aria-hidden="true" />
      </PopoverTriggerButton>

      <PopoverContent className="mt-2 w-full max-w-108 p-0 shadow-lg" align="start" side="bottom">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          defaultMonth={value?.from}
          numberOfMonths={2}
          disabled={disabled ? () => true : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

// Icon-only version matching button icon style
export function DateRangePickerIcon({ className, value, onChange, disabled = false }: Props) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "LLL dd")} - ${format(value.to, "LLL dd, y")}`
      : format(value.from, "LLL dd, y")
    : "Pick a date range";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTriggerButton
        title={label}
        aria-label={label}
        data-testid="date-picker"
        className={cn(
          "text-foreground hover:bg-muted/60 inline-flex size-8 cursor-pointer items-center justify-center rounded-sm px-2 transition-colors",
          className
        )}
        disabled={disabled}>
        <CalendarIcon className="size-4" aria-hidden="true" />
      </PopoverTriggerButton>
      <PopoverContent className="mt-2 min-w-125 p-0 shadow-lg" align="start" side="bottom">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          defaultMonth={value?.from}
          numberOfMonths={2}
          disabled={disabled ? () => true : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
