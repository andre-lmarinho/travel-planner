import type { Activity, DayPlan } from "@/features/activity/types";

/** Form values for editing an activity */
export interface ActivityFormValues {
  title: string;
  description: string;
  duration: number;
  budget: number;
  address: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  color: string;
}

/** Editor state */
export interface EditorState {
  activity: Activity | null;
  dayId: string | null;
  isOpen: boolean;
}

/** Props for the editor dialog */
export interface EditorDialogProps {
  activity: (Activity & { dayId: string }) | null;
  days: DayPlan[];
  onSave: (values: Partial<Activity>) => void;
  onDelete?: () => void;
  onClose: () => void;
  onColorChange?: (color: string) => void;
  onDayChange?: (dayId: string) => void;
  onPositionChange?: (index: number) => void;
  onImageChange?: (url: string) => void;
  destCoords?: { lat: number; lng: number } | null;
  isDemo?: boolean;
}

/** Props for the inline editor */
export interface InlineActivityProps {
  dayId: string;
  insertIndex: number;
  onSubmit: (title: string, suggestion?: Partial<Activity>) => Promise<Activity | null>;
  onClose: () => void;
  onAdvanceInline?: (nextIndex: number) => void;
  className?: string;
}

/** Color option for the picker */
export interface ColorOption {
  name: string;
  bg: string;
  border: string;
}
