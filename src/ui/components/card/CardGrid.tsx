"use client";

import type React from "react";
import { cn } from "@/ui/utils/cn";

type CardGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardGrid({ children, className }: CardGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4", className)}>{children}</div>
  );
}
