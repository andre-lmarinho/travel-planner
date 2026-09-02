"use client";

import { memo } from "react";

import { ACTIVITY_TEXT } from "@/features/activity/constants";
import { Plus } from "@/ui/components/icon";
import { cn } from "@/ui/utils/cn";

export interface AddActivityProps {
  dayId: string;
  insertIndex: number;
  className?: string;
  onAddActivity?: (dayId: string, insertIndex: number) => void;
}

export const AddActivity = memo(function AddActivity({
  dayId,
  insertIndex,
  className,
  onAddActivity,
}: AddActivityProps) {
  const handleClick = () => onAddActivity?.(dayId, insertIndex);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "bg-background hover:bg-muted text-foreground flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-left text-sm font-medium transition active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}>
      <Plus size={18} aria-hidden="true" />
      <span>{ACTIVITY_TEXT.addButton}</span>
    </button>
  );
});
