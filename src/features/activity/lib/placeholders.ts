import { generateId } from "@/lib/generateId";

import { getDefaultColor } from "../constants";
import type { Activity } from "../types";

const PLACEHOLDER_PREFIX = "blank-";

/**
 * Generate a unique activity ID.
 */
export function generateActivityId(): string {
  return generateId("act-");
}

/**
 * Check if an activity is a placeholder (unsaved).
 * Returns true if:
 * - The ID has the placeholder prefix (explicitly unsaved), OR
 * - The title is empty/whitespace (considered incomplete regardless of ID)
 */
export function isPlaceholder(activity: Pick<Activity, "id" | "title">): boolean {
  return activity.id.startsWith(PLACEHOLDER_PREFIX) || !activity.title?.trim();
}

/**
 * Create a new blank activity with default values.
 */
export function createBlankActivity(): Activity {
  return {
    id: generateActivityId(),
    title: "",
    description: "",
    color: getDefaultColor(),
    duration: 0,
    budget: 0,
    category: "",
  };
}

/**
 * Sanitize activity title, returning fallback if empty.
 */
export function sanitizeTitle(title: string | null | undefined, fallback = "Untitled activity"): string {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}
