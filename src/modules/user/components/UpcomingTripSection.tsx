import { differenceInCalendarDays, format, isValid, parseISO, startOfToday } from "date-fns";
import Link from "next/link";

import type { UserPlannerSummary } from "@/features/plan/lib/getUserPlanners";
import { DEFAULT_PLAN_COVER_IMAGE } from "@/features/search/config";

import styles from "./UpcomingTripSection.module.css";

interface UpcomingTripSectionProps {
  plan: UserPlannerSummary;
}

function getTripStats(startDate: string, endDate: string | null) {
  const start = parseISO(startDate);
  const end = endDate ? parseISO(endDate) : null;

  if (!isValid(start)) {
    return [
      { label: "Starts", value: "TBD" },
      { label: "Duration", value: "TBD" },
      { label: "Days away", value: "TBD" },
    ];
  }

  return [
    { label: "Starts", value: format(start, "MMM d") },
    {
      label: "Duration",
      value: end && isValid(end) ? `${differenceInCalendarDays(end, start) + 1} days` : "TBD",
    },
    { label: "Days away", value: `${Math.max(0, differenceInCalendarDays(start, startOfToday()))} days` },
  ];
}

export function getUpcomingPlan(plans: UserPlannerSummary[]): UserPlannerSummary | null {
  const today = startOfToday();

  return (
    plans
      .filter((plan) => {
        if (!plan.startDate) return false;

        const startDate = parseISO(plan.startDate);
        return isValid(startDate) && startDate >= today;
      })
      .toSorted((firstPlan, secondPlan) => {
        const firstDate = firstPlan.startDate ?? "";
        const secondDate = secondPlan.startDate ?? "";
        return firstDate.localeCompare(secondDate);
      })[0] ?? null
  );
}

export function UpcomingTripSection({ plan }: UpcomingTripSectionProps) {
  const backgroundImage = plan.coverImage ?? DEFAULT_PLAN_COVER_IMAGE;
  const destination = plan.destination ?? plan.title;
  const tripStats = getTripStats(plan.startDate ?? "", plan.endDate);
  const isPreparedImage = backgroundImage.includes("url(") || backgroundImage.startsWith("linear-gradient");
  const image = isPreparedImage
    ? backgroundImage
    : `url("${backgroundImage.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;

  return (
    <section aria-labelledby="upcoming-trip-heading">
      <Link
        href={`/p/${plan.publicSlug}`}
        className="group relative block min-h-88 overflow-hidden rounded-2xl bg-muted shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: image }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-black/10"
        />

        <div className="relative flex min-h-88 flex-col justify-between p-5 sm:p-6">
          <p className="w-fit rounded-full bg-black/35 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
            Next trip
          </p>

          <div
            className={`${styles.ticket} overflow-hidden rounded-2xl bg-background text-foreground shadow-lg`}>
            <div className="flex items-center px-5 py-4 sm:px-6">
              <h2 id="upcoming-trip-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {destination}
              </h2>
            </div>
            <div className="flex items-center px-3 py-3 sm:px-4">
              <dl className="grid w-full grid-cols-3 divide-x divide-border">
                {tripStats.map((stat) => (
                  <div key={stat.label} className="min-w-0 px-2 text-center sm:px-4">
                    <dt className="text-muted-foreground text-[0.65rem] font-medium tracking-[0.12em] uppercase">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 truncate text-sm font-semibold tabular-nums sm:text-base">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
