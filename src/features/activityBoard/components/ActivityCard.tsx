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

  const { border: borderColorClass } = useCardColors(
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
    <article className="group relative">
      <button
        type="button"
        className="focus-visible:ring-ring w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={handleClick}>
        <div
          className={cn(
            "relative flex w-full cursor-grab flex-col overflow-hidden rounded-xl border-2 bg-background text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
            borderColorClass
          )}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={400}
              height={200}
              className="h-28 w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="min-w-0 px-4 py-3 pl-5">
            <h3 className="truncate text-sm font-semibold leading-5">
              {title.trim() ? title : EMPTY_ACTIVITY_TITLE}
            </h3>
            {activity.description ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-4">
                {activity.description}
              </p>
            ) : null}
            {durationValue > 0 || budgetValue > 0 ? (
              <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {durationValue > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Hourglass size={13} aria-hidden="true" />
                    <span>{durationValue}h</span>
                  </span>
                ) : null}
                {budgetValue > 0 ? (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <DollarSign size={13} aria-hidden="true" />
                    <span>{budgetValue.toLocaleString("en-US")}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </button>
    </article>
  );
});
