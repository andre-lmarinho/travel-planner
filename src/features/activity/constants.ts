import type { ActivityColor } from "./types";

/** Palette of background color variables from the design system */
export const ACTIVITY_COLORS: ActivityColor[] = [
  { bg: "bg-[var(--color-0)]", border: "border-[var(--color-0-border)]", name: "White" },
  { bg: "bg-[var(--color-1)]", border: "border-[var(--color-1-border)]", name: "Orange" },
  { bg: "bg-[var(--color-2)]", border: "border-[var(--color-2-border)]", name: "Yellow" },
  { bg: "bg-[var(--color-3)]", border: "border-[var(--color-3-border)]", name: "Teal" },
  { bg: "bg-[var(--color-4)]", border: "border-[var(--color-4-border)]", name: "Sky Blue" },
  { bg: "bg-[var(--color-5)]", border: "border-[var(--color-5-border)]", name: "Pink" },
];

/** Default color index for new activities */
const DEFAULT_COLOR_INDEX = 2;

/** Get default color for new activities */
export function getDefaultColor(property: "bg" | "border" = "bg"): string {
  return ACTIVITY_COLORS[DEFAULT_COLOR_INDEX]?.[property] ?? ACTIVITY_COLORS[0]?.[property] ?? "";
}

export const EMPTY_ACTIVITY_TITLE = "Add a title";

/** UI text constants */
export const ACTIVITY_TEXT = {
  emptyTitle: EMPTY_ACTIVITY_TITLE,
  untitledFallback: "Untitled activity",
  addButton: "Add activity",
  cancel: "Cancel",
} as const;

/** Copy for inline add component */
export const ACTIVITY_COPY = {
  inlineAdd: {
    collapsedLabel: "Add activity",
    placeholderTitle: EMPTY_ACTIVITY_TITLE,
    ctaAdd: "Add activity",
    ctaCancel: "Cancel",
    a11yGroupLabel: "Add activity inline",
    errorGeneric: "Could not add the activity. Try again.",
  },
} as const;
