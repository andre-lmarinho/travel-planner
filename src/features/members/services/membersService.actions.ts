"use server";

import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { MembersRepository } from "../repositories/MembersRepository";
import type { AddMemberResult, ShareMembersData, ShareTier } from "../types";

import { MembersService } from "./MembersService";

function createService(): MembersService {
  const client = createSupabaseServerClient();
  return new MembersService(
    new MembersRepository(client),
    new PlanRepository(client),
    new ProfileRepository(client)
  );
}

export async function getMembers(planIdOrSlug: string): Promise<ShareMembersData> {
  return createService().getMembers(planIdOrSlug);
}

export async function addMember(
  planIdOrSlug: string,
  email: string,
  tier: ShareTier
): Promise<AddMemberResult> {
  return createService().addMember(planIdOrSlug, email, tier);
}

export async function updateMemberTier(planIdOrSlug: string, userId: string, tier: ShareTier): Promise<void> {
  return createService().updateMemberTier(planIdOrSlug, userId, tier);
}

export async function removeMember(planIdOrSlug: string, userId: string): Promise<void> {
  return createService().removeMember(planIdOrSlug, userId);
}

export async function leavePlan(planIdOrSlug: string): Promise<void> {
  return createService().leavePlan(planIdOrSlug);
}
