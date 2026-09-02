import type { CategoryKey } from "@/features/budget/types";
import { CATEGORIES, CHART_COLORS } from "@/features/budget/types";

export function CategoryChart({
  totalSpent,
  categoryTotals,
}: {
  totalSpent: number;
  categoryTotals: Record<CategoryKey, number>;
}) {
  const maxCategoryValue = Math.max(...Object.values(categoryTotals), 0);

  return (
    <section
      aria-labelledby="budget-categories-heading"
      className="border-border bg-card h-fit rounded-2xl border p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="budget-categories-heading" className="font-semibold tracking-[-0.02em]">
          Categories
        </h2>
      </div>

      {totalSpent <= 0 ? (
        <p className="bg-muted/35 text-muted-foreground rounded-xl px-3 py-6 text-center text-sm">
          No expenses yet
        </p>
      ) : (
        <div>
          {CATEGORIES.map((category, index) => {
            const value = categoryTotals[category.key] || 0;
            const percent = maxCategoryValue > 0 ? Math.min(100, (value / maxCategoryValue) * 100) : 0;
            const { label, icon: Icon } = category;

            return (
              <div key={category.key} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon size={13} aria-hidden="true" className="text-muted-foreground shrink-0" />
                    <span className="truncate text-sm">{label}</span>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
                    $\{value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                  aria-label={`${label} usage ${Math.round(percent)}%`}
                  className="bg-muted mt-2 h-1.5 rounded-full">
                  <div
                    className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
