"use client";

import { ToggleButton } from "@/shared/ui/button";
import type { LucideIcon } from "@/shared/ui/icon";
import { Calendar, DollarSign, List, Map as MapIcon } from "@/shared/ui/icon";

export const modeOrder = ["overview", "kanban", "map", "budget"] as const;
export type PlannerMode = (typeof modeOrder)[number];

const MODE_CONFIG: Record<PlannerMode, { label: string; icon: LucideIcon }> = {
  overview: { label: "Trip", icon: Calendar },
  kanban: { label: "Board", icon: List },
  map: { label: "Map", icon: MapIcon },
  budget: { label: "Budget", icon: DollarSign },
};

interface ModeToggleButtonProps {
  value: PlannerMode;
  onChange: (mode: PlannerMode) => void;
  modes?: readonly PlannerMode[];
}

export function ModeToggleButton({ value, onChange, modes = modeOrder }: ModeToggleButtonProps) {
  return (
    <ToggleButton
      options={[...modes]}
      value={value}
      onChange={(mode) => onChange(mode as PlannerMode)}
      renderOption={(mode) => MODE_CONFIG[mode as PlannerMode]}
    />
  );
}
