import "server-only";

import type { PlanIdentity, PlanRepository } from "@/features/plan/repositories/PlanRepository";
import type { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ApplicationError } from "@/lib/errors";
import { isUuid } from "@/shared/lib/uuid";

import type { MembersRepository } from "../repositories/MembersRepository";
import type { AddMemberResult, ShareMembersData, ShareTier } from "../types";

export class MembersService {
  constructor(
    private readonly repo: MembersRepository,
    private readonly planRepo: PlanRepository,
    private readonly profileRepo: ProfileRepository
  ) {}

  private async resolvePlanIdentity(planIdOrSlug: string): Promise<PlanIdentity | null> {
    return isUuid(planIdOrSlug)
      ? this.planRepo.fetchPlanIdentityById(planIdOrSlug)
      : this.planRepo.fetchPlanIdentityBySlug(planIdOrSlug);
  }

  private assertPlanFound(
    plan: PlanIdentity | null,
    operation: string,
    planIdOrSlug: string
  ): asserts plan is PlanIdentity {
    if (!plan) {
      throw new ApplicationError("NOT_FOUND", `${operation}: plan not found`, { cause: { planIdOrSlug } });
    }
  }

  async getMembers(planIdOrSlug: string): Promise<ShareMembersData> {
    const plan = await this.resolvePlanIdentity(planIdOrSlug);
    this.assertPlanFound(plan, "getMembers", planIdOrSlug);

    const members = await this.repo.fetchMembers(plan.id);
    const ownerId = plan.ownerId ?? members.find((member) => member.tier === "admin")?.userId ?? null;

    if (ownerId && !members.some((member) => member.userId === ownerId)) {
      const ownerProfile = await this.profileRepo.fetchProfileByUserId(ownerId);
      members.unshift({
        userId: ownerId,
        tier: "admin",
        slug: ownerProfile?.slug ?? null,
        displayName: ownerProfile?.displayName ?? null,
        avatarUrl: ownerProfile?.avatarUrl ?? null,
      });
    }

    return { ownerId, members };
  }

  async addMember(planIdOrSlug: string, email: string, tier: ShareTier): Promise<AddMemberResult> {
    const plan = await this.resolvePlanIdentity(planIdOrSlug);
    this.assertPlanFound(plan, "addMember", planIdOrSlug);
    return this.repo.addMemberByEmail(plan.id, email, tier);
  }

  async updateMemberTier(planIdOrSlug: string, userId: string, tier: ShareTier): Promise<void> {
    const plan = await this.resolvePlanIdentity(planIdOrSlug);
    this.assertPlanFound(plan, "updateMemberTier", planIdOrSlug);
    await this.repo.updateMemberTier(plan.id, userId, tier);
  }

  async removeMember(planIdOrSlug: string, userId: string): Promise<void> {
    const plan = await this.resolvePlanIdentity(planIdOrSlug);
    this.assertPlanFound(plan, "removeMember", planIdOrSlug);
    await this.repo.removeMember(plan.id, userId);
  }

  async leavePlan(planIdOrSlug: string): Promise<void> {
    const plan = await this.resolvePlanIdentity(planIdOrSlug);
    this.assertPlanFound(plan, "leavePlan", planIdOrSlug);
    await this.repo.leavePlan(plan.id);
  }
}
