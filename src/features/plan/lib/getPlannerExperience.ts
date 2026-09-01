import "server-only";

import { eachDayOfInterval } from "date-fns";

import { buildInitialDays } from "@/features/activity/lib/dayOperations";
import type { DayPlan } from "@/features/activity/types";
import { fetchPlanBudgetEntries } from "@/features/budget/repositories/BudgetRepository";
import { CATEGORIES, type CategoryKey, type Entry } from "@/features/budget/types";
import { isDemoUser } from "@/features/demo/lib/demo";
import { mapSnapshot, SnapshotRowSchema } from "@/features/snapshots/services/snapshotsSchemas";
import { ApplicationError } from "@/lib/errors";
import { getCurrentUser } from "@/shared/lib/auth/session";
import { isUuid } from "@/shared/lib/uuid";

import {
  fetchLatestSnapshot,
  fetchPlanByIdWithMembers,
  fetchPlanBySlug,
} from "../repositories/PlanRepository";

const VALID_CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as readonly CategoryKey[];

export interface PlannerExperience {
  planId: string;
  slug?: string;
  destination: string;
  title?: string;
  viewerUserId: string | null;
  isDemo: boolean;
  canEdit: boolean;
  isOwner: boolean;
  canManageMembers: boolean;
  isPublic: boolean;
  initialDays?: DayPlan[];
  initialBudget?: number;
  initialEntries?: Entry[];
}

interface GetPlannerExperienceArgs {
  identifier: string;
  dest?: string;
}

export async function getPlannerExperience({
  identifier,
  dest,
}: GetPlannerExperienceArgs): Promise<PlannerExperience> {
  const trimmed = identifier?.trim();
  if (!trimmed) {
    throw new ApplicationError("NOT_FOUND", "Planner not found.");
  }

  // UUID = direct id; anything else = public_slug. Both resolve here.
  const bySlug = !isUuid(trimmed);
  const user = await getCurrentUser();

  // Only the owner and invited members may access a shared planner. Anonymous
  // visitors are sent to login so a member can authenticate; RLS keeps private
  // plans hidden from them regardless. The adapter maps UNAUTHORIZED to /login.
  if (!user) {
    throw new ApplicationError("UNAUTHORIZED", "Sign in to view this planner.");
  }

  const plan = bySlug ? await fetchPlanBySlug(trimmed) : await fetchPlanByIdWithMembers(trimmed);
  if (!plan) {
    throw new ApplicationError("NOT_FOUND", "Planner not found.");
  }

  const isOwner = Boolean(plan.ownerId && user.id === plan.ownerId);
  const memberRow = plan.members.find((m) => m.userId === user.id);

  // Authenticated but not a member: no access to this shared planner.
  if (!isOwner && !memberRow) {
    throw new ApplicationError("FORBIDDEN", "You don't have access to this planner.");
  }

  const isAdmin = isOwner || memberRow?.tier === "admin";
  const [snapshotRow, entryRows] = await Promise.all([
    fetchLatestSnapshot(plan.id),
    fetchPlanBudgetEntries(plan.id),
  ]);
  const snapshotDays = snapshotRow ? mapSnapshot(SnapshotRowSchema.parse(snapshotRow)).days : [];

  return {
    planId: plan.id,
    slug: bySlug ? trimmed : undefined,
    destination: dest ?? plan.destinationName ?? "Destination TBD",
    title: plan.title ?? undefined,
    viewerUserId: user.id,
    isDemo: isDemoUser(user.email),
    // Reaching this branch requires ownership or membership, which is exactly edit access.
    canEdit: true,
    isOwner,
    canManageMembers: isAdmin,
    isPublic: plan.isPublic,
    initialDays: snapshotDays.length > 0 ? snapshotDays : buildDaysFromRange(plan.startDate, plan.endDate),
    initialBudget: plan.budget ?? undefined,
    initialEntries: entryRows.length > 0 ? entryRows.map(mapBudgetEntry) : undefined,
  };
}

function buildDaysFromRange(start: string | null, end: string | null): DayPlan[] | undefined {
  if (!start || !end) return undefined;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) return undefined;
  // eachDayOfInterval throws RangeError on a reversed interval.
  if (startDate > endDate) return undefined;
  return buildInitialDays(eachDayOfInterval({ start: startDate, end: endDate }));
}

type BudgetEntryRow = Awaited<ReturnType<typeof fetchPlanBudgetEntries>>[number];

function mapBudgetEntry(entry: BudgetEntryRow): Entry {
  return {
    id: entry.id,
    description: entry.description ?? "",
    // unknown categories still coerce to "transport"; reject at the DB
    // with a CHECK constraint when the schema hardens (item 10 of the audit list).
    category: VALID_CATEGORY_KEYS.includes(entry.category as CategoryKey)
      ? (entry.category as CategoryKey)
      : "transport",
    amount: entry.amount ?? 0,
  };
}
