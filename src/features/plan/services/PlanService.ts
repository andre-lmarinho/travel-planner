import "server-only";

import { format } from "date-fns";

import { fetchPlanBudgetEntries } from "@/features/budget/repositories/BudgetRepository";
import { CATEGORIES, type CategoryKey, type Entry } from "@/features/budget/types";
import { isDemoUser } from "@/features/demo/lib/demo";
import { fetchGeoapifyPlaceDetails } from "@/features/search/services/GeoapifyService";
import { fetchWikidataImage } from "@/features/search/services/WikidataService";
import { mapSnapshot, SnapshotRowSchema } from "@/features/snapshots/services/snapshotsSchemas";
import { ApplicationError } from "@/lib/errors";
import { getCurrentUser, requireUser } from "@/shared/lib/auth/session";
import { isUuid } from "@/shared/lib/uuid";

import { buildDaysFromRange } from "../lib/helpers";
import type { PlanRepository } from "../repositories/PlanRepository";

interface PlannerDestination {
  name: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  placeId?: string;
}

export interface CreateUserPlanInput {
  title: string;
  destination: PlannerDestination;
  startDate: string;
  endDate: string;
  isPublic?: boolean;
}

export interface CreateUserPlanResult {
  planId: string;
  publicSlug: string;
}

export type CreatePlannerPlanResult = CreateUserPlanResult;

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
  initialDays?: import("@/features/activity/types").DayPlan[];
  initialBudget?: number;
  initialEntries?: Entry[];
}

interface GetPlannerExperienceArgs {
  identifier: string;
  dest?: string;
}

type BudgetEntryRow = Awaited<ReturnType<typeof fetchPlanBudgetEntries>>[number];

function mapBudgetEntry(entry: BudgetEntryRow): Entry {
  return {
    id: entry.id,
    description: entry.description ?? "",
    category: VALID_CATEGORY_KEYS.includes(entry.category as CategoryKey)
      ? (entry.category as CategoryKey)
      : "transport",
    amount: entry.amount ?? 0,
  };
}

export class PlanService {
  constructor(private readonly repo: PlanRepository) {}

  async getPlannerExperience({ identifier, dest }: GetPlannerExperienceArgs): Promise<PlannerExperience> {
    const trimmed = identifier?.trim();
    if (!trimmed) {
      throw new ApplicationError("NOT_FOUND", "Planner not found.");
    }

    const bySlug = !isUuid(trimmed);
    const user = await getCurrentUser();

    if (!user) {
      throw new ApplicationError("UNAUTHORIZED", "Sign in to view this planner.");
    }

    const plan = bySlug
      ? await this.repo.fetchPlanBySlug(trimmed)
      : await this.repo.fetchPlanByIdWithMembers(trimmed);
    if (!plan) {
      throw new ApplicationError("NOT_FOUND", "Planner not found.");
    }

    const isOwner = Boolean(plan.ownerId && user.id === plan.ownerId);
    const memberRow = plan.members.find((m) => m.userId === user.id);

    if (!isOwner && !memberRow) {
      throw new ApplicationError("FORBIDDEN", "You don't have access to this planner.");
    }

    const isAdmin = isOwner || memberRow?.tier === "admin";
    const [snapshotRow, entryRows] = await Promise.all([
      this.repo.fetchLatestSnapshot(plan.id),
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
      canEdit: isOwner || memberRow?.tier !== "viewer",
      isOwner,
      canManageMembers: isAdmin,
      isPublic: plan.isPublic,
      initialDays: snapshotDays.length > 0 ? snapshotDays : buildDaysFromRange(plan.startDate, plan.endDate),
      initialBudget: plan.budget ?? undefined,
      initialEntries: entryRows.length > 0 ? entryRows.map(mapBudgetEntry) : undefined,
    };
  }

  async getUserPlanners() {
    return this.repo.getUserPlanners();
  }

  async getUserDestinations(userId: string) {
    return this.repo.getUserDestinations(userId);
  }

  async getPublicPlans() {
    try {
      return await this.repo.getPublicPlans();
    } catch (error) {
      console.warn("getPublicPlans failed; showing no recommendations", error);
      return [];
    }
  }

  async updatePlanTitle(planId: string, newTitle: string): Promise<void> {
    await this.requireMember(planId);
    await this.repo.updatePlanTitle(planId, newTitle);
  }

  async setPlanVisibility(planId: string, isPublic: boolean): Promise<void> {
    await this.requireCanManageMembers(planId);
    await this.repo.setPlanVisibility(planId, isPublic);
  }

  async updatePlanDates(planId: string, from: Date, to: Date): Promise<void> {
    await this.requireMember(planId);
    await this.repo.updatePlanDates(planId, format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"));
  }

  async updatePlanCoverImage(planId: string, coverImageUrl: string): Promise<void> {
    await this.repo.updatePlanCoverImage(planId, coverImageUrl);
  }

  async createUserPlan(input: CreateUserPlanInput): Promise<CreateUserPlanResult> {
    const user = await requireUser();
    const { title, destination, startDate, endDate, isPublic } = input;

    const coverImagePromise = destination.placeId
      ? fetchGeoapifyPlaceDetails(destination.placeId)
          .then((details) => (details.wikidataId ? fetchWikidataImage(details.wikidataId) : undefined))
          .catch((error) => {
            console.error("Failed to fetch cover image metadata", {
              placeId: destination.placeId,
              error,
            });
            return undefined;
          })
      : Promise.resolve(undefined);

    const { id, publicSlug } = await this.repo.createPlan({
      title,
      destName: destination.name,
      destLat: destination.latitude,
      destLong: destination.longitude,
      destCountry: destination.country,
      startDate: startDate.slice(0, 10),
      endDate: endDate.slice(0, 10),
      userId: user.id,
    });

    if (isPublic) {
      await this.repo.setPlanVisibility(id, true);
    }

    coverImagePromise
      .then((coverImageUrl) => {
        if (coverImageUrl) {
          return this.repo.updatePlanCoverImage(id, coverImageUrl);
        }
      })
      .catch((error) => {
        console.error("Failed to update cover image", { planId: id, error });
      });

    return { planId: id, publicSlug };
  }

  async deletePlan(planId: string): Promise<string> {
    const normalizedPlanId = planId.trim();
    if (!normalizedPlanId) {
      throw new ApplicationError("BAD_REQUEST", "deletePlan: missing planId.");
    }

    const user = await requireUser();
    const plan = await this.repo.fetchPlanByIdWithMembers(normalizedPlanId);

    if (!plan) {
      throw new ApplicationError(
        "NOT_FOUND",
        `Unable to delete plan: operation=deletePlan planId=${normalizedPlanId} userId=${user.id} reason=not-found`
      );
    }

    const isOwner = plan.ownerId === user.id;
    if (!isOwner) {
      throw new ApplicationError(
        "FORBIDDEN",
        `Unable to delete plan: operation=deletePlan planId=${normalizedPlanId} userId=${user.id} reason=unauthorized`
      );
    }

    await this.repo.delete(normalizedPlanId);

    const redirectTo = await this.resolvePlannerRedirect(user.id);
    return redirectTo;
  }

  private async resolvePlannerRedirect(userId: string): Promise<string> {
    try {
      const { fetchProfileSlugByUserId } = await import("@/features/profile/repositories/ProfileRepository");
      const slug = await fetchProfileSlugByUserId(userId);
      return slug ? `/u/${slug}` : "/";
    } catch (error) {
      console.error("resolvePlannerRedirect failed", {
        userId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return "/";
    }
  }

  private async requireMember(planId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) {
      throw new ApplicationError("UNAUTHORIZED", `Sign in to modify plan [${planId}].`);
    }

    const plan = await this.repo.fetchPlanByIdWithMembers(planId);
    if (!plan) {
      throw new ApplicationError("NOT_FOUND", `Plan [${planId}] not found`);
    }
    const isOwner = Boolean(plan.ownerId && user.id === plan.ownerId);
    const isMember = plan.members.some((m) => m.userId === user.id);
    if (!isOwner && !isMember) {
      throw new ApplicationError("FORBIDDEN", "You don't have access to this planner.");
    }
  }

  private async requireCanManageMembers(planId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) {
      throw new ApplicationError("UNAUTHORIZED", `Sign in to manage plan [${planId}].`);
    }

    const plan = await this.repo.fetchPlanByIdWithMembers(planId);
    if (!plan) {
      throw new ApplicationError("NOT_FOUND", `Plan [${planId}] not found`);
    }
    const isOwner = Boolean(plan.ownerId && user.id === plan.ownerId);
    const memberRow = plan.members.find((m) => m.userId === user.id);
    const isAdmin = isOwner || memberRow?.tier === "admin";
    if (!isAdmin) {
      throw new ApplicationError("FORBIDDEN", "You don't have permission to change plan visibility.");
    }
  }
}
