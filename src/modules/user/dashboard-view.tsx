import type { UserDestination } from "@/features/plan/lib/getUserDestinations";
import type { UserPlannerSummary } from "@/features/plan/lib/getUserPlanners";
import { DashboardMap } from "@/modules/user/components/DashboardMap";
import { InspirationsSection } from "@/modules/user/components/InspirationsSection";
import { PlannersSection } from "@/modules/user/components/PlannersSection";
import { getUpcomingPlan, UpcomingTripSection } from "@/modules/user/components/UpcomingTripSection";
import { MapPin } from "@/shared/ui/icon";

interface DashboardViewProps {
  displayName: string | null;
  plans: UserPlannerSummary[];
  destinations: UserDestination[];
}

export function DashboardView({ displayName, plans, destinations }: DashboardViewProps) {
  const greeting = displayName ? `${displayName}'s travels` : "Your travels";

  // Destinations are already deduped by city name; countries dedupe here.
  const cityCount = destinations.length;
  const countryCount = new Set(destinations.map((destination) => destination.country).filter(Boolean)).size;
  const stats = [
    `${cityCount} ${cityCount === 1 ? "city" : "cities"}`,
    `${countryCount} ${countryCount === 1 ? "country" : "countries"}`,
  ].join(" · ");

  const pins = destinations.flatMap((destination) =>
    destination.lat != null && destination.lng != null
      ? [{ name: destination.name, lat: destination.lat, lng: destination.lng }]
      : []
  );
  const upcomingPlan = getUpcomingPlan(plans);

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 md:px-8">
      <section className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground text-sm">{stats}</p>
      </section>

      {upcomingPlan ? <UpcomingTripSection plan={upcomingPlan} /> : null}

      <section aria-labelledby="map-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary h-5 w-5" aria-hidden="true" />
          <h2 id="map-heading" className="text-foreground text-base font-semibold">
            Your travel map
          </h2>
        </div>
        <DashboardMap pins={pins} />
      </section>

      <PlannersSection plans={plans} />
      <InspirationsSection excludePlanIds={plans.map((plan) => plan.id)} />
    </main>
  );
}
