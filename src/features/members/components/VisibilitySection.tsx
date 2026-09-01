"use client";

import { useState } from "react";

import { usePlannerContext } from "@/features/plan/hooks/PlannerContext";
import { trpc } from "@/trpc/react";
import { SelectMenu, type SelectMenuOption } from "@/ui/components/select/SelectMenu";

type Visibility = "private" | "public";

const VISIBILITY_OPTIONS: ReadonlyArray<SelectMenuOption<Visibility>> = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

export function VisibilitySection() {
  const { planId, isPublic, canManageMembers } = usePlannerContext();
  const [visibility, setVisibility] = useState<Visibility>(isPublic ? "public" : "private");
  const visibilityMutation = trpc.viewer.plan.setVisibility.useMutation();
  const pending = visibilityMutation.isPending;
  const [error, setError] = useState("");

  const handleChange = async (next: Visibility) => {
    const previous = visibility;
    setVisibility(next);
    setError("");
    try {
      await visibilityMutation.mutateAsync({ planId, isPublic: next === "public" });
    } catch {
      setVisibility(previous);
      setError("Could not update visibility. Please try again.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-foreground text-sm font-medium">Visibility</p>
          <p className="text-muted-foreground text-xs">Public plans are viewable by anyone with the link.</p>
        </div>
        <SelectMenu
          value={visibility}
          options={VISIBILITY_OPTIONS}
          onChange={handleChange}
          disabled={!canManageMembers || pending}
          ariaLabel="Plan visibility"
          triggerClassName="w-28 shrink-0"
          contentClassName="w-28"
        />
      </div>
      {!canManageMembers ? (
        <p className="text-muted-foreground text-xs">Only admins can change visibility.</p>
      ) : null}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
