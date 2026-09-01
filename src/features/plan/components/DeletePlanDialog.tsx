"use client";

import { useRouter } from "next/navigation";

import { ConfirmationDialog } from "@/shared/ui/dialog/ConfirmationDialog";
import { Trash2 } from "@/shared/ui/icon";
import { cn } from "@/shared/utils/cn";
import { trpc } from "@/trpc/react";
import { usePlannerContext } from "../hooks/PlannerContext";

type DeletePlanDialogProps = {
  className?: string;
  isDemo?: boolean;
};

export function DeletePlanDialog({ className, isDemo = false }: DeletePlanDialogProps) {
  const { planId, isOwner } = usePlannerContext();
  const deleteMutation = trpc.viewer.plan.delete.useMutation();
  const isPending = deleteMutation.isPending;
  const router = useRouter();

  if (!isOwner || isDemo) {
    return null;
  }

  const handleConfirm = async () => {
    if (isPending) {
      return;
    }

    try {
      const redirectTo = await deleteMutation.mutateAsync({ planId });
      router.push(redirectTo);
    } catch (err) {
      console.error("Unable to delete plan", {
        planId,
        message: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  };

  return (
    <ConfirmationDialog
      trigger={
        <button
          type="button"
          aria-label="Delete planner"
          disabled={isPending}
          className={cn(
            "text-foreground hover:bg-muted/60 inline-flex size-8 cursor-pointer items-center justify-center rounded-sm px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}>
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      }
      title="Delete planner"
      description="This will permanently delete this planner and all of its data."
      confirmLabel={isPending ? "Deleting..." : "Delete"}
      onConfirm={handleConfirm}
      isPending={isPending}
    />
  );
}
