"use server";

import { fetchProfileSlugByUserId } from "@/features/profile/repositories/ProfileRepository";
import { ApplicationError, formatSupabaseError } from "@/lib/errors";
import { requireUser } from "@/shared/lib/auth/session";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { fetchPlanByIdWithMembers } from "../repositories/PlanRepository";

type DeletePlanResult = {
  redirectTo: string;
};

export async function deletePlan(planId: string): Promise<DeletePlanResult> {
  const normalizedPlanId = planId.trim();
  if (!normalizedPlanId) {
    throw new ApplicationError("BAD_REQUEST", "deletePlan: missing planId.");
  }

  const user = await requireUser();
  const plan = await fetchPlanByIdWithMembers(normalizedPlanId);

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

  const supabase = createSupabaseServerClient();
  const redirectTo = await resolvePlannerRedirect(user.id);

  // Child rows cascade via ON DELETE CASCADE and the owner-only DELETE policy
  // authorizes this row, so a single delete is atomic — no service role, no loop.
  const { error } = await supabase.from("plans").delete().eq("id", normalizedPlanId);
  if (error) {
    throw formatSupabaseError({
      operation: "deletePlan",
      identifiers: { planId: normalizedPlanId },
      error,
    });
  }

  return { redirectTo };
}

async function resolvePlannerRedirect(userId: string): Promise<string> {
  try {
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
