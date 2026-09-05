"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  addActivityAtIndex,
  moveActivityPosition,
  moveActivityToDay,
  removeActivity,
  updateActivity,
} from "@/features/activity/lib/activityOperations";
import { createBlankActivity } from "@/features/activity/lib/placeholders";
import type { Activity, DayPlan } from "@/features/activity/types";
import type { Entry } from "@/features/budget/types";
import type { PlannerExperience } from "@/features/plan/services/PlanService";
import { ActivityDialog } from "@/modules/planner/components/ActivityDialog";
import { DeletePlanDialog } from "@/modules/planner/components/DeletePlanDialog";
import { SharePlannerDialog } from "@/modules/planner/components/SharePlannerDialog";
import { BoardView } from "@/modules/planner/views/BoardView";
import { BudgetView } from "@/modules/planner/views/BudgetView";
import { trpc } from "@/trpc/react";
import { DateRangePickerIcon } from "@/ui/components/calendar";

import type { PlannerMode } from "./components/ModeToggleButton";
import { ModeToggleButton } from "./components/ModeToggleButton";
import { usePlannerDocument } from "./hooks/usePlannerDocument";
import { TripView } from "./views/TripView";

const MapView = dynamic(() => import("@/modules/planner/views/MapView"), {
  ssr: false,
});

function PlannerContent({
  title: initialTitle,
  isDemo,
  initialEntries,
  planId,
  initialDays,
  destination,
  viewerUserId,
  isOwner,
  canManageMembers,
}: {
  title: string;
  isDemo: boolean;
  initialEntries?: Entry[];
  planId: string;
  initialDays?: DayPlan[];
  destination?: string;
  viewerUserId: string | null;
  isOwner: boolean;
  canManageMembers: boolean;
}) {
  const [mode, setMode] = useState<PlannerMode>("overview");
  const {
    planId: documentPlanId,
    days,
    setDays,
    currentRange,
    handleRangeChange,
    destCoords,
  } = usePlannerDocument({ initialDays, planId, dest: destination, viewerUserId });
  const [selectedActivity, setSelectedActivity] = useState<(Activity & { dayId: string }) | null>(null);
  const [hoveredDayId, setHoveredDayId] = useState<string | null>(null);
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);
  const highlightDay = useCallback((dayId: string | null) => {
    setHoveredDayId(dayId);
    setHoveredActivityId(null);
  }, []);
  const highlightActivity = useCallback((activityId: string | null) => {
    setHoveredActivityId(activityId);
    setHoveredDayId(null);
  }, []);
  const selectActivity = useCallback((activity: Activity, dayId: string) => {
    setSelectedActivity({ ...activity, dayId });
  }, []);
  const save = useCallback(
    (updates: Partial<Activity>) => {
      if (!selectedActivity) return;
      const currentDay = days.find((day) => day.id === selectedActivity.dayId);
      if (!currentDay) return;
      const nextActivity = { ...selectedActivity, ...updates };
      const exists = currentDay.activities.some((activity) => activity.id === selectedActivity.id);
      if (!exists) {
        if (!nextActivity.title.trim()) return;
        setDays(addActivityAtIndex(days, selectedActivity.dayId, nextActivity, currentDay.activities.length));
      } else {
        setDays(updateActivity(days, selectedActivity.id, updates));
      }
      setSelectedActivity(nextActivity);
    },
    [days, selectedActivity, setDays]
  );
  const changeDay = useCallback(
    (newDayId: string) => {
      if (!selectedActivity || selectedActivity.dayId === newDayId) return;
      setDays(moveActivityToDay(days, selectedActivity.id, newDayId));
      setSelectedActivity({ ...selectedActivity, dayId: newDayId });
    },
    [days, selectedActivity, setDays]
  );
  const changePosition = useCallback(
    (newIndex: number) => {
      if (selectedActivity) setDays(moveActivityPosition(days, selectedActivity.id, newIndex));
    },
    [days, selectedActivity, setDays]
  );
  const deleteActivity = useCallback(() => {
    if (!selectedActivity) return;
    setDays(removeActivity(days, selectedActivity.id));
    setSelectedActivity(null);
  }, [days, selectedActivity, setDays]);
  const closeDialog = useCallback(() => setSelectedActivity(null), []);
  const [title, setTitle] = useState(initialTitle);
  const updateTitleMutation = trpc.viewer.plan.updateTitle.useMutation();

  const handleFallbackAdd = useCallback((dayId: string) => {
    const activity = createBlankActivity();
    setSelectedActivity({ ...activity, dayId });
  }, []);

  useEffect(() => {
    document.title = `${title} | Turistar App`;
  }, [title]);

  const handleTitleBlur = async () => {
    if (!title.trim()) {
      setTitle(initialTitle);
      return;
    }
    await updateTitleMutation.mutateAsync({ planId: documentPlanId, title: title.trim() });
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
            className="focus-visible:border-border focus-visible:bg-background focus-visible:ring-ring absolute inset-0 cursor-pointer rounded-md border-2 border-transparent bg-transparent px-2 py-1 transition-colors outline-none focus:cursor-text focus-visible:ring-2 focus-visible:ring-offset-2"
          />
        </h1>
        <div className="flex flex-none items-center gap-1 self-end md:self-end">
          <DateRangePickerIcon value={currentRange} onChange={handleRangeChange} />
          <DeletePlanDialog planId={documentPlanId} isOwner={isOwner} isDemo={isDemo} />
          {!isDemo ? (
            <SharePlannerDialog
              planId={documentPlanId}
              canManageMembers={canManageMembers}
              viewerUserId={viewerUserId}
            />
          ) : null}
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
            <MapView
              days={days}
              destCoords={destCoords}
              onActivitySelect={selectActivity}
              highlightedDayId={hoveredDayId}
              highlightedActivityId={hoveredActivityId}
              onDayHover={highlightDay}
              className="h-full"
            />
          </div>
        ) : null}
        {mode === "overview" || mode === "map" ? (
          <>
            <div className={`absolute inset-0 z-10 xl:hidden ${mode === "map" ? "hidden" : ""}`}>
              <BoardView
                days={days}
                onActivitySelect={selectActivity}
                onDaysChange={setDays}
                onFallbackAdd={handleFallbackAdd}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
              <TripView
                days={days}
                onActivitySelect={selectActivity}
                onDaysChange={setDays}
                onFallbackAdd={handleFallbackAdd}
                onDayHover={highlightDay}
                onActivityHover={highlightActivity}
              />
            </div>
          </>
        ) : mode === "kanban" ? (
          <div className="absolute inset-0">
            <BoardView
              days={days}
              onActivitySelect={selectActivity}
              onDaysChange={setDays}
              onFallbackAdd={handleFallbackAdd}
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <BudgetView planId={documentPlanId} days={days} initialEntries={initialEntries} />
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
    <PlannerContent
      title={title}
      isDemo={experience.isDemo}
      initialEntries={experience.initialEntries}
      planId={experience.planId}
      initialDays={experience.initialDays}
      destination={experience.destination}
      viewerUserId={experience.viewerUserId}
      isOwner={experience.isOwner}
      canManageMembers={experience.canManageMembers}
    />
  );
}
