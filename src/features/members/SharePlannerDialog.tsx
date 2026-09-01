"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTriggerButton } from "@/shared/ui/dialog";
import { Share2 } from "@/shared/ui/icon";

import { InviteForm } from "./components/InviteForm";
import { MembersSection } from "./components/MembersSection";
import { VisibilitySection } from "./components/VisibilitySection";

export function SharePlannerDialog({ planId, isDemo = false }: { planId: string; isDemo?: boolean }) {
  const [open, setOpen] = useState(false);

  if (isDemo) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTriggerButton
        type="button"
        className="text-foreground hover:bg-muted/60 inline-flex size-8 cursor-pointer items-center justify-center rounded-sm px-2 transition-colors"
        aria-label="Share planner">
        <Share2 className="size-4" aria-hidden="true" />
      </DialogTriggerButton>
      <DialogContent>
        <DialogHeader
          title="Share planner"
          description="Publish your plan publicly, invite people, and manage planner members."
        />
        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
          <VisibilitySection />
          <InviteForm planId={planId} />
          <MembersSection planId={planId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
