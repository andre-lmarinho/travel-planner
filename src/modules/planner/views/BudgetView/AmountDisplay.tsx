"use client";

import type { FocusEvent } from "react";
import { useRef, useState } from "react";

const currencySymbol = "\u0024";
const inputClasses =
  "h-11 w-full rounded-xl border border-border bg-background px-3 pl-8 text-right text-base font-semibold tabular-nums outline-none transition-shadow focus:ring-2 focus:ring-ring focus:ring-offset-1";

export interface AmountDisplayProps {
  value?: number | string;
  variant: "input" | "span";
  onValueChange?: (value: number) => void;
  onBlur?: () => void;
  ariaLabel?: string;
  placeholder?: string;
  inputId?: string;
  compact?: boolean;
}

export function AmountDisplay({
  value = 0,
  variant,
  onValueChange,
  onBlur,
  ariaLabel,
  placeholder,
  inputId,
  compact = false,
}: AmountDisplayProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const lastReportedValue = useRef<number>(Number(value) || 0);

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    const parsedValue = Number(inputValue);
    const normalized = Number.isFinite(parsedValue) ? parsedValue : 0;
    if (onValueChange && normalized !== lastReportedValue.current) {
      onValueChange(normalized);
      lastReportedValue.current = normalized;
    }
    setInputValue(normalized ? String(normalized) : "0");
    onBlur?.();
  };

  if (variant === "input") {
    return (
      <div className="relative">
        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-base font-semibold">
          {currencySymbol}
        </span>
        <input
          id={inputId}
          name={inputId}
          type="text"
          value={inputValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setInputValue(nextValue);
            const parsedValue = Number(nextValue);
            const normalized = Number.isFinite(parsedValue) ? parsedValue : 0;
            onValueChange?.(normalized);
            lastReportedValue.current = normalized;
          }}
          onBlur={handleBlur}
          autoComplete="off"
          placeholder={placeholder}
          className={inputClasses}
          inputMode="decimal"
          aria-label={ariaLabel}
        />
      </div>
    );
  }

  const numericValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const formattedValue = numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const accessibleLabel = (ariaLabel || "Amount").concat(": ", currencySymbol, formattedValue);

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={
        compact
          ? "inline-flex items-baseline gap-1 text-base font-semibold tracking-[-0.02em] tabular-nums"
          : "inline-flex items-baseline gap-1 text-2xl font-semibold tracking-[-0.04em] tabular-nums"
      }>
      <span
        className={
          compact
            ? "text-current text-xs font-medium opacity-65"
            : "text-current text-base font-medium opacity-65"
        }>
        {currencySymbol}
      </span>
      <span>{formattedValue}</span>
    </span>
  );
}
