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
          "bg-background pointer-events-none origin-bottom rotate-2 cursor-grabbing rounded-xl border shadow-lg opacity-95 backdrop-blur-md",
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
        "relative touch-none list-none transition-opacity duration-200",
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
        <div className="bg-primary/5 border-primary/50 absolute inset-0 rounded-xl border-2 border-dashed" />
      )}
    </div>
  );
});
