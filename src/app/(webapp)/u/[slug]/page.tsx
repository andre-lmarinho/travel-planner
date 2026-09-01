import type { Metadata } from "next";

import { isDemoUser } from "@/features/demo/lib/demo";
import { resetDemoIfStale } from "@/features/demo/lib/resetDemoIfStale";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { PlanService } from "@/features/plan/services/PlanService";
import { requireProfileSlugMatch } from "@/features/profile/lib/requireProfileSlugMatch";
import { DashboardView } from "@/modules/user/dashboard-view";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export const metadata: Metadata = {
  title: "Your travels | Turistar App",
};

interface UserDashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function UserDashboardPage({ params }: UserDashboardPageProps) {
  const { slug } = await params;
  const { user, profile } = await requireProfileSlugMatch(slug);

  const isDemo = isDemoUser(user.email);
  if (isDemo) {
    await resetDemoIfStale();
  }

  const service = new PlanService(new PlanRepository(createSupabaseServerClient()));
  const [plans, destinations] = await Promise.all([
    service.getUserPlanners(),
    service.getUserDestinations(user.id),
  ]);

  return (
    <DashboardView
      displayName={profile.displayName}
      plans={plans}
      destinations={destinations}
      isDemo={isDemo}
    />
  );
}
