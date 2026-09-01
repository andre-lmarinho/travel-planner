"use client";

import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/ui/utils/cn";

type SpinnerProps = Omit<ComponentPropsWithoutRef<"span">, "children" | "aria-label"> & {
  "aria-label"?: string;
  busy?: boolean;
  label?: string;
  labelClassName?: string;
};

export function Spinner({
  className,
  busy = true,
  label,
  labelClassName = "sr-only",
  "aria-label": ariaLabel,
  "aria-live": ariaLive = "polite",
  ...props
}: SpinnerProps) {
  const resolvedLabel = label ?? ariaLabel ?? "Loading";

  return (
    <span
      {...props}
      className={cn(
        "border-primary inline-block size-5 animate-spin rounded-full border-2 border-t-transparent",
        className
      )}
      aria-busy={busy}
      aria-live={ariaLive}>
      <span className={labelClassName}>{resolvedLabel}</span>
    </span>
  );
}
