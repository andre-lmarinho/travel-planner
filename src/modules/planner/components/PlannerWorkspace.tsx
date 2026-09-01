"use client";

import dynamic from "next/dynamic";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import type { DayPlan } from "@/features/activity/types";
import { ActivityBoard } from "@/features/activityBoard/components/ActivityBoard";
import { ActivityDialog } from "@/features/activityDialog/components/ActivityDialog";
import { BudgetBoard } from "@/features/budget/components/BudgetBoard";
import type { Entry } from "@/features/budget/types";
import { SharePlannerDialog } from "@/features/members/SharePlannerDialog";
import { DeletePlanDialog } from "@/features/plan/components/DeletePlanDialog";
import { PlannerProvider, usePlannerContext } from "@/features/plan/hooks/PlannerContext";
import { updatePlanTitle } from "@/features/plan/lib/updatePlanTitle";
import { DateRangePickerIcon } from "@/shared/ui/calendar";

import type { PlannerMode } from "./ModeToggleButton";
import { ModeToggleButton } from "./ModeToggleButton";
import { TripOverview } from "./TripOverview";

const MapBoard = dynamic(() => import("@/features/mapBoard/MapBoard"), {
  ssr: false,
});

export interface PlannerWorkspaceProps {
  initialDays?: DayPlan[];
  planId: string;
  title: string;
  dest?: string;
  canEdit?: boolean;
  isDemo?: boolean;
  viewerUserId?: string | null;
  isOwner?: boolean;
  canManageMembers?: boolean;
  isPublic?: boolean;
  initialBudget?: number;
  initialEntries?: Entry[];
}

type PlannerWorkspaceContentProps = {
  title: string;
  canEdit: boolean;
  isDemo: boolean;
  initialBudget?: number;
  initialEntries?: Entry[];
};

function PlannerWorkspaceContent({
  title: initialTitle,
  canEdit,
  isDemo,
  initialBudget,
  initialEntries,
}: PlannerWorkspaceContentProps) {
  const [mode, setMode] = useState<PlannerMode>("overview");
  const {
    planId,
    days,
    setDays,
    currentRange,
    handleRangeChange,
    selectedActivity,
    setSelectedActivity,
    addActivityWithTitle,
    save,
    deleteActivity,
    changeColor,
    changeDay,
    changePosition,
    closeDialog,
    destCoords,
  } = usePlannerContext();

  const [title, setTitle] = useState(initialTitle);

  // Fallback for adding activity when inline add is disabled
  const handleFallbackAdd = useCallback(
    async (dayId: string, index: number) => {
      const activity = await addActivityWithTitle(dayId, "", index);
      if (activity) {
        setSelectedActivity({ ...activity, dayId });
      }
    },
    [addActivityWithTitle, setSelectedActivity]
  );

  useEffect(() => {
    document.title = `${title} | Turistar App`;
  }, [title]);

  const handleTitleBlur = async () => {
    if (!title.trim()) {
      setTitle(initialTitle);
      return;
    }

    if (canEdit) {
      await updatePlanTitle(planId, title.trim());
    }
  };

  return (
    <main
      id="main-content"
      className="bg-card relative flex flex-1 flex-col overflow-hidden p-4 md:px-6 md:pb-8 xl:px-8">
      <div className="flex w-full flex-row justify-between gap-4 pb-4 md:items-center">
        <h1 className="bg-card py-2 relative inline-block min-w-[1ch] flex-none cursor-pointer rounded-md text-xl font-semibold whitespace-nowrap capitalize hover:bg-[color-mix(in_oklch,var(--card)_75%,var(--card-foreground)_5%)]">
          <span
            aria-hidden="true"
            className="invisible whitespace-pre rounded-md border-2 border-transparent px-2 py-1">
            {title}
          </span>
          <input
            id="planner-title"
            name="title"
            aria-label="Planner title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={handleTitleBlur}
            onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
            readOnly={!canEdit}
            disabled={!canEdit}
            className="focus-visible:border-border focus-visible:bg-background focus-visible:ring-ring absolute inset-0 cursor-pointer rounded-md border-2 border-transparent bg-transparent px-2 py-1 transition-colors outline-none focus:cursor-text focus-visible:ring-2 focus-visible:ring-offset-2"
          />
        </h1>
        <div className="flex flex-none items-center gap-1 self-end md:self-end">
          <DateRangePickerIcon value={currentRange} onChange={handleRangeChange} disabled={!canEdit} />
          {canEdit && !isDemo ? <SharePlannerDialog planId={planId} /> : null}
          <DeletePlanDialog isDemo={isDemo} />
          <div className="hidden pl-2 xl:inline">
            <ModeToggleButton
              value={mode === "map" ? "overview" : mode}
              onChange={setMode}
              modes={["overview", "kanban", "budget"]}
            />
          </div>
        </div>
      </div>

      <div className="relative w-full flex-1 overflow-visible">
        {mode === "overview" || mode === "map" ? (
          <div className={`absolute inset-0 z-0 ${mode === "overview" ? "invisible xl:visible" : ""}`}>
            <MapBoard className="h-full" />
          </div>
        ) : null}
        {mode === "overview" || mode === "map" ? (
          <>
            <div className={`absolute inset-0 z-10 xl:hidden ${mode === "map" ? "hidden" : ""}`}>
              <ActivityBoard
                days={days}
                canEdit={canEdit}
                onActivitySelect={(activity, dayId) => setSelectedActivity({ ...activity, dayId })}
                onDaysChange={setDays}
                onFallbackAdd={handleFallbackAdd}
              />
            </div>
            <div className="absolute inset-0 z-10 pointer-events-none hidden xl:block">
              <TripOverview
                days={days}
                canEdit={canEdit}
                onActivitySelect={(activity, dayId) => setSelectedActivity({ ...activity, dayId })}
                onDaysChange={setDays}
                onFallbackAdd={handleFallbackAdd}
              />
            </div>
          </>
        ) : mode === "kanban" ? (
          <div className="absolute inset-0">
            <ActivityBoard
              days={days}
              canEdit={canEdit}
              onActivitySelect={(activity, dayId) => setSelectedActivity({ ...activity, dayId })}
              onDaysChange={setDays}
              onAddActivity={addActivityWithTitle}
              onFallbackAdd={handleFallbackAdd}
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <BudgetBoard initialBudget={initialBudget} initialEntries={initialEntries} canEdit={canEdit} />
          </div>
        )}
      </div>

      <ActivityDialog
        key={selectedActivity?.id}
        activity={selectedActivity}
        days={days}
        onSave={save}
        onDelete={deleteActivity}
        onClose={closeDialog}
        onColorChange={changeColor}
        onDayChange={changeDay}
        onPositionChange={changePosition}
        destCoords={destCoords}
        isDemo={isDemo}
      />

      <div className="flex flex-none items-center gap-2 self-center p-6 xl:hidden">
        <ModeToggleButton
          value={mode === "overview" ? "kanban" : mode}
          onChange={setMode}
          modes={["kanban", "map", "budget"]}
        />
      </div>
    </main>
  );
}

export function PlannerWorkspace({
  initialDays,
  planId,
  title,
  dest,
  canEdit = true,
  isDemo = false,
  viewerUserId = null,
  isOwner = false,
  canManageMembers = false,
  isPublic = false,
  initialBudget,
  initialEntries,
}: PlannerWorkspaceProps) {
  return (
    <PlannerProvider
      initialDays={initialDays}
      planId={planId}
      dest={dest}
      canEdit={canEdit}
      viewerUserId={viewerUserId}
      isOwner={isOwner}
      canManageMembers={canManageMembers}
      isPublic={isPublic}>
      <PlannerWorkspaceContent
        title={title}
        canEdit={canEdit}
        isDemo={isDemo}
        initialBudget={initialBudget}
        initialEntries={initialEntries}
      />
    </PlannerProvider>
  );
}
