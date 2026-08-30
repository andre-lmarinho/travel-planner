"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsDesktop } from "@/modules/marketing/components/KeyBenefits/hooks/useIsDesktop";
import { cn } from "@/shared/utils/cn";
import styles from "../FeatureCarousel.module.css";
import { usePointerDragScroll } from "../hooks/usePointerDragScroll";
import { useSyncedPointerCarousels } from "../hooks/useSyncedPointerCarousels";
import { FeatureCarouselCard } from "./FeatureCarouselCard";
import { FeatureCarouselNavDots } from "./FeatureCarouselNavDots";

export type FeatureCarouselFeature = {
  title: string;
  description: string;
  imgSrc: string;
};

type FeatureCarouselProps = {
  features: FeatureCarouselFeature[];
};

export function FeatureCarousel({ features }: FeatureCarouselProps) {
  const cardsRef = useRef<HTMLUListElement | null>(null);
  const imagesRef = useRef<HTMLUListElement | null>(null);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const carouselRefs = useMemo(() => [cardsRef, imagesRef] as const, []);
  const { activeIndex, select, scrollHandlers } = useSyncedPointerCarousels(carouselRefs);
  const [cardsHandlers, imagesHandlers] = scrollHandlers;

  const isDesktop = useIsDesktop();
  const interactive = hasMounted && isDesktop;

  usePointerDragScroll(cardsRef, cardsHandlers, !isDesktop);
  usePointerDragScroll(imagesRef, imagesHandlers);

  const previousIsDesktopRef = useRef(isDesktop);
  useEffect(() => {
    if (!hasMounted) return;

    const previousIsDesktop = previousIsDesktopRef.current;
    if (previousIsDesktop === isDesktop) return;

    previousIsDesktopRef.current = isDesktop;

    if (!cardsRef.current || !imagesRef.current) return;

    select(activeIndex);
  }, [activeIndex, hasMounted, isDesktop, select]);

  const handleCardSelect = useCallback(
    (index: number) => {
      if (!interactive) return;
      select(index);
    },
    [interactive, select]
  );

  const handleDotSelect = useCallback(
    (index: number) => {
      select(index);
    },
    [select]
  );

  return (
    <div className="flex flex-col gap-8 md:gap-3">
      <FeatureCarouselNavDots
        total={features.length}
        current={activeIndex}
        onSelect={handleDotSelect}
        className="order-2 justify-center md:order-1 md:justify-end md:self-end"
      />
      <div className="order-1 flex flex-col gap-8 md:order-2 md:grid md:grid-cols-3 md:gap-8">
        <div className="order-2 md:order-0">
          <ul
            ref={cardsRef}
            className={cn(
              "scrollbar-hidden m-0 flex w-full cursor-grab [touch-action:pan-y] snap-x snap-proximity gap-4 overflow-x-auto p-0 md:cursor-auto md:touch-auto md:snap-none md:flex-col md:gap-4 md:overflow-visible",
              styles.dragContext
            )}>
            {features.map((feature, index) => (
              <li
                key={feature.title}
                className={cn("min-w-full shrink-0 basis-full snap-start md:min-w-0 md:basis-auto")}>
                <FeatureCarouselCard
                  feature={feature}
                  isActive={index === activeIndex}
                  interactive={interactive}
                  onSelect={() => handleCardSelect(index)}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 overflow-hidden md:order-0 md:col-span-2">
          <ul
            ref={imagesRef}
            tabIndex={-1}
            aria-hidden="true"
            className={cn(
              "scrollbar-hidden m-0 flex w-full cursor-grab [touch-action:pan-y] snap-x snap-proximity gap-4 overflow-x-auto p-0",
              styles.dragContext
            )}>
            {features.map((feature, index) => (
              <li key={feature.title} className="min-w-full shrink-0 basis-full snap-start">
                <div className="select-none">
                  <Image
                    src={feature.imgSrc}
                    alt=""
                    role="presentation"
                    width={1600}
                    height={900}
                    className="block h-auto w-full overflow-hidden rounded-xl object-contain"
                    priority={index === activeIndex}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
