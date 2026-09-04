import "server-only";

import { format } from "date-fns";
import type { Viewer } from "@/features/auth/lib/session";
import type { BudgetEntryRow } from "@/features/budget/repositories/BudgetRepository";
import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import type { Entry } from "@/features/budget/types";
import { isDemoUser } from "@/features/demo/lib/demo";
import type { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { fetchGeoapifyPlaceDetails } from "@/features/search/services/GeoapifyService";
import { fetchWikidataImage } from "@/features/search/services/WikidataService";
import type { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";
import { ApplicationError } from "@/lib/errors";
import { isUuid } from "@/lib/uuid";
import { buildDaysFromRange } from "../lib/helpers";
import type { PlanMemberRecord, PlanRepository } from "../repositories/PlanRepository";

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
}

export interface CreateUserPlanResult {
  planId: string;
}

export type CreatePlannerPlanResult = CreateUserPlanResult;

export interface PlannerExperience {
  planId: string;
  slug?: string;
  destination: string;
  title?: string;
  viewerUserId: string | null;
  isDemo: boolean;
  isOwner: boolean;
  canManageMembers: boolean;
  initialDays?: import("@/features/activity/types").DayPlan[];
  initialBudget?: number;
  initialEntries?: Entry[];
}

interface GetPlannerExperienceArgs {
  identifier: string;
  dest?: string;
}

function mapBudgetEntry(entry: BudgetEntryRow): Entry {
  return BudgetRepository.mapEntries([entry])[0];
}

export class PlanService {
  constructor(
    private readonly repo: PlanRepository,
    private readonly budgetRepo: BudgetRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly snapshots: SnapshotsService,
    private readonly viewer: Viewer | null = null
  ) {}

  async getPlannerExperience({ identifier, dest }: GetPlannerExperienceArgs): Promise<PlannerExperience> {
    const trimmed = identifier?.trim();
    if (!trimmed) {
      throw new ApplicationError("NOT_FOUND", "Planner not found.");
    }

    const bySlug = !isUuid(trimmed);
    const viewer = this.requireViewer("view a plan");
    const plan = bySlug
      ? await this.repo.fetchPlanBySlug(trimmed)
      : await this.repo.fetchPlanByIdWithMembers(trimmed);
    if (!plan) {
      throw new ApplicationError("NOT_FOUND", "Planner not found.");
    }

    const members: PlanMemberRecord[] = "members" in plan ? (plan.members as PlanMemberRecord[]) : [];
    const isOwner = Boolean(viewer && plan.ownerId && viewer.id === plan.ownerId);
    const memberRow = members.find((member) => member.userId === viewer.id);
    if (!isOwner && !memberRow) {
      throw new ApplicationError("FORBIDDEN", "You don't have access to this planner.");
    }

    const isAdmin = isOwner || memberRow?.tier === "admin";
    const [snapshot, entryRows] = await Promise.all([
      this.snapshots.fetchSnapshot(plan.id),
      this.fetchBudgetEntries(plan.id),
    ]);
    const snapshotDays = snapshot.days;

    return {
      planId: plan.id,
      slug: bySlug ? trimmed : undefined,
      destination: dest ?? plan.destinationName ?? "Destination TBD",
      title: plan.title ?? undefined,
      viewerUserId: viewer.id,
      isDemo: isDemoUser(viewer?.email),
      isOwner,
      canManageMembers: isAdmin,
      initialDays: snapshotDays.length > 0 ? snapshotDays : buildDaysFromRange(plan.startDate, plan.endDate),
      initialBudget: plan.budget ?? undefined,
      initialEntries: entryRows.length > 0 ? entryRows.map(mapBudgetEntry) : undefined,
    };
  }

  async getUserPlanners() {
    return this.repo.getUserPlanners();
  }

  async getUserDestinations() {
    return this.repo.getUserDestinations(this.requireViewer("view destinations").id);
  }

  async updatePlanTitle(planId: string, newTitle: string): Promise<void> {
    await this.requireMember(planId);
    await this.repo.updatePlanTitle(planId, newTitle);
  }

  async updatePlanDates(planId: string, from: Date, to: Date): Promise<void> {
    await this.requireMember(planId);
    await this.repo.updatePlanDates(planId, format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"));
  }

  async createUserPlan(input: CreateUserPlanInput): Promise<CreateUserPlanResult> {
    const user = this.requireViewer("create a plan");
    const { title, destination, startDate, endDate } = input;

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

    const { id } = await this.repo.createPlan({
      title,
      destName: destination.name,
      destLat: destination.latitude,
      destLong: destination.longitude,
      destCountry: destination.country,
      startDate: startDate.slice(0, 10),
      endDate: endDate.slice(0, 10),
      userId: user.id,
    });

    coverImagePromise
      .then((coverImageUrl) => {
        if (coverImageUrl) {
          return this.repo.updatePlanCoverImage(id, coverImageUrl);
        }
      })
      .catch((error) => {
        console.error("Failed to update cover image", { planId: id, error });
      });

    return { planId: id };
  }

  async deletePlan(planId: string): Promise<string> {
    const normalizedPlanId = planId.trim();
    if (!normalizedPlanId) {
      throw new ApplicationError("BAD_REQUEST", "deletePlan: missing planId.");
    }

    const user = this.requireViewer("delete a plan");
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

  private requireViewer(operation: string): Viewer {
    if (this.viewer) return this.viewer;
    throw new ApplicationError("UNAUTHORIZED", `Sign in to ${operation}.`);
  }

  private async resolvePlannerRedirect(userId: string): Promise<string> {
    try {
      const slug = await this.profileRepo.fetchProfileSlugByUserId(userId);
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
    const user = this.requireViewer("modify a plan");

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

  private async fetchBudgetEntries(planId: string): Promise<BudgetEntryRow[]> {
    return this.budgetRepo.fetchPlanBudgetEntries(planId);
  }
}
