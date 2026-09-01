import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { PlanService } from "@/features/plan/services/PlanService";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";
import { Card } from "@/shared/ui/card/Card";
import { CardGrid } from "@/shared/ui/card/CardGrid";
import { Sparkles } from "@/shared/ui/icon";

export async function InspirationsSection({ excludePlanIds = [] }: { excludePlanIds?: string[] }) {
  const exclude = new Set(excludePlanIds);
  const service = new PlanService(new PlanRepository(createSupabaseServerClient()));
  const plans = (await service.getPublicPlans()).filter((plan) => !exclude.has(plan.id));

  // "Fellow travelers" excludes the viewer's own plans (already listed under "Your planners");
  // hide the whole section when nothing else is public.
  if (plans.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary h-5 w-5" aria-hidden="true" />
        <h2 className="text-foreground text-base font-semibold">Be inspired by fellow travelers</h2>
      </div>
      <CardGrid>
        {plans.map((plan) => (
          <Card
            key={plan.id}
            href={`/p/${plan.publicSlug}`}
            title={plan.title}
            image={plan.coverImage ?? undefined}
          />
        ))}
      </CardGrid>
    </section>
  );
}
