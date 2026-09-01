import type { Metadata } from "next";

import { isDemoUser } from "@/features/demo/lib/demo";
import { resetDemoIfStale } from "@/features/demo/lib/resetDemoIfStale";
import { createPlanService } from "@/features/plan/services/createPlanService";
import { requireProfileSlugMatch } from "@/features/profile/lib/requireProfileSlugMatch";
import { DashboardView } from "@/modules/user/dashboard-view";

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

  const { service } = createPlanService();
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
