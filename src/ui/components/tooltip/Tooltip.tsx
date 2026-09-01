"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type * as React from "react";

import { cn } from "@/ui/utils/cn";

type TooltipPosition = "top" | "right" | "bottom" | "left";

type TooltipProps = {
  children: React.ReactElement;
  content: React.ReactNode;
  delayDuration?: number;
  position?: TooltipPosition;
  className?: string;
};

export function Tooltip({
  children,
  content,
  delayDuration = 100,
  position = "top",
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delay={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger render={children} />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner side={position} align="center" sideOffset={6}>
            <TooltipPrimitive.Popup
              className={cn(
                "text-background bg-foreground pointer-events-none z-50 rounded px-2 py-1 text-xs",
                className
              )}>
              {content}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
