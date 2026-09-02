import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/features/auth/lib/session";
import { isDemoUser } from "@/features/demo/lib/demo";
import { resetDemoIfStale } from "@/features/demo/lib/resetDemoIfStale";
import { createPlanService } from "@/features/plan/services/createPlanService";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";
import { DashboardView } from "@/modules/user/dashboard-view";
import { createSupabaseServerClient } from "@/supabase/server";

export const metadata: Metadata = {
  title: "Your travels | Turistar App",
};

interface UserDashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function UserDashboardPage({ params }: UserDashboardPageProps) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const profile = await new ProfileService(
    new ProfileRepository(createSupabaseServerClient())
  ).getViewerProfile(viewer.id);
  if (profile.slug !== slug.trim()) redirect(`/u/${profile.slug}`);

  const user = viewer;

  const isDemo = isDemoUser(user.email);
  if (isDemo) {
    await resetDemoIfStale();
  }

  const { service } = createPlanService(viewer);
  const [plans, destinations] = await Promise.all([service.getUserPlanners(), service.getUserDestinations()]);

  return (
    <DashboardView
      displayName={profile.displayName}
      plans={plans}
      destinations={destinations}
      isDemo={isDemo}
    />
  );
}
