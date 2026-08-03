import type { Metadata } from "next";

import { getUserDestinations } from "@/features/plan/lib/getUserDestinations";
import { getUserPlanners } from "@/features/plan/lib/getUserPlanners";
import { requireProfileSlugMatch } from "@/features/profile/lib/requireProfileSlugMatch";
import { DashboardView } from "@/modules/user/dashboard-view";

export const metadata: Metadata = {
  title: "Your trips | Turistar",
};

interface UserDashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function UserDashboardPage({ params }: UserDashboardPageProps) {
  const { slug } = await params;
  const { user, profile } = await requireProfileSlugMatch(slug);
  const [plans, destinations] = await Promise.all([getUserPlanners(), getUserDestinations(user.id)]);

  return <DashboardView displayName={profile.displayName} plans={plans} destinations={destinations} />;
}
