"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import type { PlannerExperience } from "@/features/plan/services/PlanService";
import { PlannerWorkspace } from "@/modules/planner/components/PlannerWorkspace";

interface PlanIdViewProps {
  experience: PlannerExperience;
}

export function PlanIdView({ experience }: PlanIdViewProps) {
  const router = useRouter();
  const search = useSearchParams();

  // Clean URL when accessing via slug with query params
  useEffect(() => {
    if (experience.slug && search.toString()) {
      router.replace(`/p/${experience.slug}`, { scroll: false });
    }
  }, [search, router, experience.slug]);

  return (
    <PlannerWorkspace
      initialDays={experience.initialDays}
      planId={experience.planId}
      dest={experience.destination}
      title={
        experience.title?.trim() && experience.title.trim() !== experience.slug?.trim()
          ? experience.title
          : experience.destination
      }
      initialEntries={experience.initialEntries}
      canEdit={experience.canEdit}
      isDemo={experience.isDemo}
      viewerUserId={experience.viewerUserId}
      isOwner={experience.isOwner}
      canManageMembers={experience.canManageMembers}
      isPublic={experience.isPublic}
    />
  );
}
