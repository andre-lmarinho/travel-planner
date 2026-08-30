import { cn } from "@/shared/utils/cn";

import type { FeatureCarouselFeature } from "./FeatureCarousel";

type FeatureCarouselCardProps = {
  feature: FeatureCarouselFeature;
  isActive: boolean;
  interactive: boolean;
  onSelect?: () => void;
};

export function FeatureCarouselCard({ feature, isActive, interactive, onSelect }: FeatureCarouselCardProps) {
  const cardClassName = cn(
    "relative w-full bg-background overflow-hidden rounded p-6 text-left",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 focus-visible:outline-offset-0",
    "transition-[transform,box-shadow,background-color] duration-200 ease-out",
    "cursor-default md:cursor-pointer",
    "pointer-events-none md:pointer-events-auto",
    isActive ? "md:[box-shadow:rgba(9,30,66,0.15)_0px_0.5rem_1rem_0px]" : "md:[box-shadow:none]",
    "before:absolute before:inset-y-0 before:left-0 before:w-[6px]",
    'before:bg-primary before:content-[""] before:opacity-100',
    "before:transition-opacity before:duration-200 before:ease-out",
    isActive ? "md:before:bg-primary md:before:opacity-100" : "md:before:opacity-0"
  );

  return (
    <button
      type="button"
      onClick={interactive ? onSelect : undefined}
      aria-pressed={interactive ? isActive : undefined}
      aria-disabled={!interactive}
      tabIndex={interactive ? 0 : -1}
      className={cardClassName}>
      <h3 className="pb-4 text-xl font-medium md:leading-[1.2]">{feature.title}</h3>
      <p>{feature.description}</p>
    </button>
  );
}
