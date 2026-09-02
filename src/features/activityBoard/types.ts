import type { UniqueIdentifier } from "@dnd-kit/core";

import type { Activity, DayPlan } from "@/features/activity/types";

/** Drag state for the board */
export interface DragState {
  activeId: UniqueIdentifier | null;
  isDragging: boolean;
}

/** Board callbacks */
export interface BoardCallbacks {
  onActivitySelect?: (activity: Activity, dayId: string) => void;
  onDaysChange?: (days: DayPlan[]) => void;
  onFallbackAdd?: (dayId: string, index: number) => void;
}

/** Props for the board component */
export interface BoardProps extends BoardCallbacks {
  days: DayPlan[];
  canEdit?: boolean;
}

/** Props for a day column */
export interface DayColumnProps {
  day: DayPlan;
  dayNumber?: number;
  canEdit?: boolean;
  onActivitySelect?: (activity: Activity, dayId: string) => void;
  onFallbackAdd?: (dayId: string, index: number) => void;
}
