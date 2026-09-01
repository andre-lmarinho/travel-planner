"use client";

import type React from "react";
import { forwardRef } from "react";

import { cn } from "@/ui/utils/cn";

export interface ToggleButtonProps<T extends string = string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  renderOption?: (option: T) => {
    label: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

function ToggleButtonInner<T extends string = string>(
  { options, value, onChange, disabled = false, className, renderOption, ...props }: ToggleButtonProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const handleOptionClick = (option: T) => {
    if (!disabled) {
      onChange(option);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "bg-background border-border relative flex h-10 overflow-hidden rounded-md border p-1",
        disabled && "opacity-50",
        className
      )}
      style={{
        anchorName: "--nav",
      }}
      {...props}>
      <div
        className="bg-primary absolute rounded-sm transition-all duration-200 ease-out"
        style={{
          positionAnchor: "--active",
          top: "anchor(top)",
          right: "anchor(right)",
          bottom: "anchor(bottom)",
          left: "anchor(left)",
        }}
      />

      {options.map((option) => {
        const isSelected = option === value;
        const optionConfig = renderOption?.(option);
        const label = optionConfig?.label ?? String(option);
        const Icon = optionConfig?.icon;

        return (
          <button
            key={String(option)}
            type="button"
            onClick={() => handleOptionClick(option)}
            disabled={disabled}
            aria-pressed={isSelected}
            style={
              isSelected
                ? {
                    anchorName: "--active",
                  }
                : undefined
            }
            className={cn(
              "relative z-10 flex-1 cursor-pointer px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected ? "text-primary-foreground" : "text-foreground hover:text-foreground"
            )}>
            <div className="flex h-full w-full items-center justify-center gap-2 p-2">
              {Icon && <Icon aria-hidden="true" className="h-4 w-4" />}
              {label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const ToggleButton = forwardRef(ToggleButtonInner);
