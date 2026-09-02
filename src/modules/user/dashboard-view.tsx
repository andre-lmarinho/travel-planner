import { DemoGuideDialog } from "@/features/demo/components/DemoGuideDialog";
import type { UserDestination, UserPlannerSummary } from "@/features/plan/repositories/PlanRepository";
import { DashboardMap } from "@/modules/user/components/DashboardMap";
import type { TravelCountry } from "@/modules/user/components/DestinationsMap";
import { PlannersSection } from "@/modules/user/components/PlannersSection";
import { getUpcomingPlan, UpcomingTripSection } from "@/modules/user/components/UpcomingTripSection";
import { MapPin } from "@/ui/components/icon";

interface DashboardViewProps {
  plans: UserPlannerSummary[];
  destinations: UserDestination[];
  isDemo?: boolean;
}

function buildCountrySummaries(destinations: UserDestination[]): TravelCountry[] {
  const summaries = new Map<
    string,
    {
      tripIds: Set<string>;
      locationCount: number;
      trips: Map<string, { id: string; title: string }>;
    }
  >();

  for (const destination of destinations) {
    const code = destination.country?.trim();
    if (!code) continue;

    const key = code.toLocaleLowerCase();
    const summary = summaries.get(key) ?? {
      tripIds: new Set<string>(),
      locationCount: 0,
      trips: new Map<string, { id: string; title: string }>(),
    };

    summary.tripIds.add(destination.planId);
    summary.locationCount += destination.activityCount;
    summary.trips.set(destination.planId, { id: destination.planId, title: destination.planTitle });
    summaries.set(key, summary);
  }

  return Array.from(summaries, ([code, summary]) => ({
    code,
    tripCount: summary.tripIds.size,
    locationCount: summary.locationCount,
    trips: Array.from(summary.trips.values()),
  }));
}

export function DashboardView({ plans, destinations, isDemo = false }: DashboardViewProps) {
  const countries = buildCountrySummaries(destinations);
  const upcomingPlan = getUpcomingPlan(plans);

  return (
    <main id="main-content" className="bg-card min-h-[calc(100dvh-4rem)] w-full">
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 md:px-8">
        {upcomingPlan ? <UpcomingTripSection plan={upcomingPlan} /> : null}

        <section aria-labelledby="map-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 id="map-heading" className="text-foreground text-base font-semibold">
              Your travel map
            </h2>
          </div>
          <DashboardMap countries={countries} />
        </section>

        <PlannersSection plans={plans} />
        <DemoGuideDialog isDemo={isDemo} />
      </div>
    </main>
  );
}
