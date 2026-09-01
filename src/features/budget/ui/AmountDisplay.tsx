import type { ChangeEvent, FocusEvent } from "react";
import { useRef, useState } from "react";

import { DollarSign } from "@/ui/components/icon";

import { normalizeAmount } from "../lib/normalizeAmount";

const containerClasses = "grid w-28 grid-cols-[auto_1fr] items-center overflow-hidden rounded border";
const iconClasses = "bg-muted border-r";
const dollarIconClasses = "text-muted-foreground m-2 size-4";
const valueClasses = "w-full px-2 py-1 text-right";

export interface AmountDisplayProps {
  value?: number | string;
  variant: "input" | "span";
  onValueChange?: (value: number) => void;
  onBlur?: () => void;
  canEdit?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  inputId?: string;
}

export function AmountDisplay({
  value = 0,
  variant,
  onValueChange,
  onBlur,
  canEdit = true,
  ariaLabel,
  placeholder,
  inputId,
}: AmountDisplayProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const lastReportedValue = useRef<number>(normalizeAmount(String(value)));

  const handleBlur = (_: FocusEvent<HTMLInputElement>) => {
    const val = normalizeAmount(inputValue);
    if (onValueChange && val !== lastReportedValue.current) {
      onValueChange(val);
      lastReportedValue.current = val;
    }
    setInputValue(val ? String(val) : "0");
    if (onBlur) onBlur();
  };

  if (variant === "input") {
    return (
      <div className={`${containerClasses} has-focus:ring-2 has-focus:ring-primary has-focus:ring-offset-2`}>
        <span className={iconClasses}>
          <DollarSign aria-hidden="true" className={dollarIconClasses} />
        </span>
        <input
          id={inputId}
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            if (onValueChange) {
              const normalized = normalizeAmount(newValue);
              onValueChange(normalized);
              lastReportedValue.current = normalized;
            }
          }}
          onBlur={handleBlur}
          disabled={!canEdit}
          autoComplete="off"
          placeholder={placeholder}
          className={`${valueClasses} bg-transparent outline-none`}
          inputMode="decimal"
          aria-label={ariaLabel}
        />
      </div>
    );
  }

  const numericValue = typeof value === "string" ? parseFloat(value) || 0 : value;

  return (
    <div className={`${containerClasses} bg-muted/30`}>
      <span className="sr-only">
        {ariaLabel}: ${numericValue.toFixed(2)}
      </span>
      <span className={iconClasses}>
        <DollarSign aria-hidden="true" className={dollarIconClasses} />
      </span>
      <span className={valueClasses} aria-hidden="true">
        {numericValue.toFixed(2)}
      </span>
    </div>
  );
}
