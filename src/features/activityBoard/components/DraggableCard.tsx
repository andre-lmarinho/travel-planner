"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";
import type { Activity } from "@/features/activity/types";
import { cn } from "@/ui/utils/cn";

import { ActivityCard } from "./ActivityCard";

export interface DraggableCardProps {
  id: string;
  activity: Activity;
  onSelect?: () => void;
  dragOverlay?: boolean;
  className?: string;
  bgColor?: string;
}

export const DraggableCard = memo(function DraggableCard({
  id,
  activity,
  onSelect,
  bgColor,
  dragOverlay = false,
  className,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges: () => false,
  });

  if (dragOverlay) {
    return (
      <div
        className={cn(
          "bg-background pointer-events-none origin-bottom rotate-3 cursor-grabbing rounded-lg opacity-90 backdrop-blur-md transition-transform duration-200 ease-out",
          className
        )}>
        <ActivityCard activity={activity} onSelect={onSelect} bgColor={bgColor} />
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative touch-none list-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      data-no-drag-scroll
      {...attributes}
      {...listeners}>
      <div className={cn(isDragging && "opacity-0")}>
        <ActivityCard activity={activity} onSelect={onSelect} bgColor={bgColor} />
      </div>
      {isDragging && (
        <div className="bg-background border-border absolute inset-0 rounded-lg border-2 border-dashed" />
      )}
    </div>
  );
});
