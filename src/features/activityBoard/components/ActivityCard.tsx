"use client";

import Image from "next/image";
import { memo } from "react";

import { EMPTY_ACTIVITY_TITLE } from "@/features/activity/constants";
import { useCardColors } from "@/features/activity/hooks/useActivityColors";
import type { Activity } from "@/features/activity/types";
import { DollarSign, Hourglass } from "@/ui/components/icon";
import { cn } from "@/ui/utils/cn";

export interface ActivityCardProps {
  activity: Activity;
  onSelect?: () => void;
  onClick?: () => void;
  bgColor?: string;
}

export const ActivityCard = memo(function ActivityCard({
  activity,
  onSelect,
  onClick,
  bgColor,
}: ActivityCardProps) {
  const { title, duration, budget, color, imageUrl } = activity;

  const { twBg, border: borderColorClass } = useCardColors(
    color && !color.startsWith("#") ? color : undefined,
    bgColor
  );

  const durationValue = duration ?? 0;
  const budgetValue = budget ?? 0;

  const handleClick = () => {
    onSelect?.();
    onClick?.();
  };

  return (
    <div className="group relative">
      <button type="button" className="w-full text-left" onClick={handleClick}>
        <div
          className={cn(
            "group relative flex w-full cursor-grab flex-col items-stretch overflow-hidden rounded-lg border border-b-3 text-left transition",
            borderColorClass,
            twBg
          )}>
          {/* Image */}
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=""
              width={400}
              height={200}
              className="h-30 w-full rounded-t-lg object-cover"
              // Dead URLs (deleted assets, renamed Wikimedia files) degrade to
              // the imageless card instead of a broken-image block.
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}

          <div className="px-3 pt-2 pb-1">
            {/* Title */}
            <h3 className="mb-1 text-sm">{title.trim() ? title : EMPTY_ACTIVITY_TITLE}</h3>

            {/* Meta */}
            {(durationValue > 0 || budgetValue > 0) && (
              <div className="mb-1 flex gap-2 rounded-full text-xs">
                {durationValue > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Hourglass size={12} aria-hidden="true" />
                  </span>
                )}
                {budgetValue > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <DollarSign size={12} aria-hidden="true" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
});
