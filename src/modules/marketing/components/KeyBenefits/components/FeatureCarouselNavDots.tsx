import { cn } from "@/shared/utils/cn";

type FeatureCarouselNavDotsProps = {
  total: number;
  current: number;
  onSelect: (index: number) => void;
  className?: string;
};

export function FeatureCarouselNavDots({ total, current, onSelect, className }: FeatureCarouselNavDotsProps) {
  const dots = Array.from({ length: total }, (_, value) => value);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {dots.map((dot) => {
        const isActive = dot === current;
        return (
          <button
            key={`dot-${dot}`}
            type="button"
            onClick={() => onSelect(dot)}
            className={cn(
              "h-6 cursor-pointer rounded-full transition-[width] duration-200 ease-out",
              isActive ? "bg-secondary w-15" : "bg-card-foreground w-6"
            )}
            aria-label={`Go to slide ${dot + 1}`}
            aria-current={isActive ? "true" : undefined}
          />
        );
      })}
    </div>
  );
}
