"use client";

import { memo, useMemo } from "react";

import { ACTIVITY_COPY } from "@/features/activity/constants";
import { Plus } from "@/ui/components/icon";
import { cn } from "@/ui/utils/cn";

const INLINE_ADD_ENABLED =
  process.env.NEXT_PUBLIC_PLANNER_INLINE_ADD === undefined ||
  !["0", "false", "off"].includes(String(process.env.NEXT_PUBLIC_PLANNER_INLINE_ADD).toLowerCase());

export type AddCardPlacement = "between" | "end";

export interface AddActivityProps {
  dayId: string;
  insertIndex: number;
  className?: string;
  placement?: AddCardPlacement;
  onInlineOpen?: (index: number) => void;
  onFallbackAdd?: (dayId: string, insertIndex: number) => void;
  isInlineOpen?: boolean;
  isHidden?: boolean;
}

export const AddActivity = memo(function AddActivity({
  dayId,
  insertIndex,
  className,
  placement = "end",
  onInlineOpen,
  onFallbackAdd,
  isInlineOpen = false,
  isHidden = false,
}: AddActivityProps) {
  const copy = ACTIVITY_COPY.inlineAdd;

  const collapsedClasses = useMemo(() => {
    if (placement === "between") {
      return "group cursor-pointer relative flex h-2 w-full items-center justify-center transition";
    }
    return "flex h-10 cursor-pointer w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";
  }, [placement]);

  const handleClick = () => {
    if (!INLINE_ADD_ENABLED || !onInlineOpen) {
      onFallbackAdd?.(dayId, insertIndex);
      return;
    }

    onInlineOpen(insertIndex);
  };

  const buttonClassName = cn(collapsedClasses, className, isHidden && "hidden");

  if (placement === "between") {
    return (
      <button type="button" aria-expanded={isInlineOpen} onClick={handleClick} className={buttonClassName}>
        <span className="sr-only">{copy.collapsedLabel}</span>
        <Plus
          size={20}
          aria-hidden="true"
          className="bg-card z-10 h-5 w-6 rounded opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        />
        <span className="border-border absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t-2 border-dashed opacity-0 transition group-hover:opacity-100"></span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-expanded={isInlineOpen}
      onClick={handleClick}
      className={cn(buttonClassName, "bg-background hover:bg-card text-foreground text-left")}>
      <Plus size={18} aria-hidden="true" />
      <span>{copy.collapsedLabel}</span>
    </button>
  );
});
