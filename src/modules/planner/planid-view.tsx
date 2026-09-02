"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { ActivityDialog } from "@/features/activityDialog/components/ActivityDialog";
import type { Entry } from "@/features/budget/types";
import type { PlannerExperience } from "@/features/plan/services/PlanService";
import { DeletePlanDialog } from "@/modules/planner/components/DeletePlanDialog";
import { SharePlannerDialog } from "@/modules/planner/components/SharePlannerDialog";
import { PlannerProvider, usePlannerContext } from "@/modules/planner/hooks/PlannerContext";
import { BoardView } from "@/modules/planner/views/BoardView";
import { BudgetView } from "@/modules/planner/views/BudgetView/BudgetView";
import { trpc } from "@/trpc/react";
import { DateRangePickerIcon } from "@/ui/components/calendar";

import type { PlannerMode } from "./components/ModeToggleButton";
import { ModeToggleButton } from "./components/ModeToggleButton";
import { TripView } from "./views/TripView";

const MapView = dynamic(() => import("@/modules/planner/views/MapView"), {
  ssr: false,
});

function PlannerContent({
  title: initialTitle,
  canEdit,
  isDemo,
  initialEntries,
}: {
  title: string;
  canEdit: boolean;
  isDemo: boolean;
  initialEntries?: Entry[];
}) {
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
  const updateTitleMutation = trpc.viewer.plan.updateTitle.useMutation();

  const handleFallbackAdd = useCallback(
    async (dayId: string, index: number) => {
      const activity = await addActivityWithTitle(dayId, "", index);
      if (activity) setSelectedActivity({ ...activity, dayId });
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
    if (canEdit) await updateTitleMutation.mutateAsync({ planId, title: title.trim() });
  };

  return (
    <main
      id="main-content"
      className="bg-card relative flex flex-1 flex-col overflow-hidden p-4 md:px-6 md:pb-8 xl:px-8">
      <div className="flex w-full flex-row justify-between gap-4 pb-4 md:items-center">
        <h1 className="bg-card relative inline-block min-w-[1ch] flex-none cursor-pointer rounded-md py-2 text-xl font-semibold capitalize whitespace-nowrap hover:bg-[color-mix(in_oklch,var(--card)_75%,var(--card-foreground)_5%)]">
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
            <MapView className="h-full" />
          </div>
        ) : null}
        {mode === "overview" || mode === "map" ? (
          <>
            <div className={`absolute inset-0 z-10 xl:hidden ${mode === "map" ? "hidden" : ""}`}>
              <BoardView
                days={days}
                canEdit={canEdit}
                onActivitySelect={(activity, dayId) => setSelectedActivity({ ...activity, dayId })}
                onDaysChange={setDays}
                onFallbackAdd={handleFallbackAdd}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
              <TripView
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
            <BoardView
              days={days}
              canEdit={canEdit}
              onActivitySelect={(activity, dayId) => setSelectedActivity({ ...activity, dayId })}
              onDaysChange={setDays}
              onFallbackAdd={handleFallbackAdd}
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <BudgetView initialEntries={initialEntries} canEdit={canEdit} />
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

export function PlanIdView({ experience }: { experience: PlannerExperience }) {
  const router = useRouter();
  const search = useSearchParams();
  const title =
    experience.title?.trim() && experience.title.trim() !== experience.slug?.trim()
      ? experience.title
      : experience.destination;

  useEffect(() => {
    if (experience.slug && search.toString()) {
      router.replace(`/p/${experience.slug}`, { scroll: false });
    }
  }, [search, router, experience.slug]);

  return (
    <PlannerProvider
      initialDays={experience.initialDays}
      planId={experience.planId}
      dest={experience.destination}
      canEdit={experience.canEdit}
      viewerUserId={experience.viewerUserId}
      isOwner={experience.isOwner}
      canManageMembers={experience.canManageMembers}
      isPublic={experience.isPublic}>
      <PlannerContent
        title={title}
        canEdit={experience.canEdit}
        isDemo={experience.isDemo}
        initialEntries={experience.initialEntries}
      />
    </PlannerProvider>
  );
}
