"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlanIdentity } from "@/features/plan/repositories/PlanRepository";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { fetchProfileByUserId } from "@/features/profile/repositories/ProfileRepository";
import type { ApplicationErrorOptions } from "@/lib/errors";
import { ApplicationError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";
import { isUuid } from "@/shared/lib/uuid";
import type { Database } from "@/shared/types/supabase";

import * as MembersRepository from "../repositories/MembersRepository";
import type { AddMemberResult, ShareMembersData, ShareTier } from "../types";

async function resolvePlanIdentity(
  planIdOrSlug: string,
  { client }: { client: SupabaseClient<Database> }
): Promise<PlanIdentity | null> {
  const repo = new PlanRepository(client);
  return isUuid(planIdOrSlug)
    ? repo.fetchPlanIdentityById(planIdOrSlug)
    : repo.fetchPlanIdentityBySlug(planIdOrSlug);
}

type ResolvedPlan = NonNullable<Awaited<ReturnType<typeof resolvePlanIdentity>>>;

function assertPlanFound(
  plan: ResolvedPlan | null,
  operation: string,
  options?: ApplicationErrorOptions
): asserts plan is ResolvedPlan {
  if (!plan) {
    throw new ApplicationError("NOT_FOUND", `${operation}: plan not found`, options);
  }
}

export async function getMembers(planIdOrSlug: string): Promise<ShareMembersData> {
  const client = createSupabaseServerClient();
  const plan = await resolvePlanIdentity(planIdOrSlug, { client });
  assertPlanFound(plan, "getMembers", { cause: { planIdOrSlug } });

  const members = await MembersRepository.fetchMembers(plan.id, { client });
  const ownerId = plan.ownerId ?? members.find((member) => member.tier === "admin")?.userId ?? null;

  // Only fetch owner profile if owner is not already in members list
  if (ownerId && !members.some((member) => member.userId === ownerId)) {
    const ownerProfile = await fetchProfileByUserId(ownerId, { client });
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

export async function addMember(
  planIdOrSlug: string,
  email: string,
  tier: ShareTier
): Promise<AddMemberResult> {
  const client = createSupabaseServerClient();
  const plan = await resolvePlanIdentity(planIdOrSlug, { client });

  assertPlanFound(plan, "addMember", { cause: { planIdOrSlug } });

  return MembersRepository.addMemberByEmail(plan.id, email, tier, { client });
}

export async function updateMemberTier(planIdOrSlug: string, userId: string, tier: ShareTier): Promise<void> {
  const client = createSupabaseServerClient();
  const plan = await resolvePlanIdentity(planIdOrSlug, { client });

  assertPlanFound(plan, "updateMemberTier", { cause: { planIdOrSlug } });

  await MembersRepository.updateMemberTier(plan.id, userId, tier, { client });
}

export async function removeMember(planIdOrSlug: string, userId: string): Promise<void> {
  const client = createSupabaseServerClient();
  const plan = await resolvePlanIdentity(planIdOrSlug, { client });

  assertPlanFound(plan, "removeMember", { cause: { planIdOrSlug } });

  await MembersRepository.removeMember(plan.id, userId, { client });
}

export async function leavePlan(planIdOrSlug: string): Promise<void> {
  const client = createSupabaseServerClient();
  const plan = await resolvePlanIdentity(planIdOrSlug, { client });

  assertPlanFound(plan, "leavePlan", { cause: { planIdOrSlug } });

  await MembersRepository.leavePlan(plan.id, { client });
}
