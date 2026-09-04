import type { Viewer } from "@/features/auth/lib/session";
import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { SnapshotsRepository } from "@/features/snapshots/repositories/SnapshotsRepository";
import { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";
import { createSupabaseServerClient } from "@/supabase/server";

import { PlanRepository } from "../repositories/PlanRepository";
import { PlanService } from "./PlanService";

export function createPlanService(viewer: Viewer | null = null) {
  const client = createSupabaseServerClient();
  const repo = new PlanRepository(client);
  const service = new PlanService(
    repo,
    new BudgetRepository(client),
    new ProfileRepository(client),
    new SnapshotsService(new SnapshotsRepository(client)),
    viewer
  );
  return { repo, service };
}
