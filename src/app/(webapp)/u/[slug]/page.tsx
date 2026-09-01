import type { Metadata } from "next";

import { isDemoUser } from "@/features/demo/lib/demo";
import { resetDemoIfStale } from "@/features/demo/lib/resetDemoIfStale";
import { getUserDestinations } from "@/features/plan/lib/getUserDestinations";
import { getUserPlanners } from "@/features/plan/lib/getUserPlanners";
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

  const [plans, destinations] = await Promise.all([getUserPlanners(), getUserDestinations(user.id)]);

  return (
    <DashboardView
      displayName={profile.displayName}
      plans={plans}
      destinations={destinations}
      isDemo={isDemo}
    />
  );
}
