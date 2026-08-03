import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { scrollToChild } from "../utils/scrollToChild";
import type { PointerDragHandlers } from "./usePointerDragScroll";

type SyncedCarouselRegistration = RefObject<HTMLUListElement | null>;

type UseSyncedPointerCarouselsOptions = {
  initialIndex?: number;
  onChange?: (index: number) => void;
};

export function useSyncedPointerCarousels(
  carousels: ReadonlyArray<SyncedCarouselRegistration>,
  { initialIndex = 0, onChange }: UseSyncedPointerCarouselsOptions = {}
) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const carouselsRef = useRef(carousels);
  const activeIndexRef = useRef(initialIndex);

  const syncTo = useCallback(
    (index: number, notify: boolean, driver: number | null) => {
      const changed = activeIndexRef.current !== index;
      activeIndexRef.current = index;
      if (changed) {
        setActiveIndex(index);
      }

      carouselsRef.current.forEach((ref, idx) => {
        if (idx === driver) return;
        const el = ref.current;
        if (el) {
          scrollToChild(el, index, { smooth: true, disableSnap: true });
        }
      });

      if (notify) {
        onChange?.(index);
      }
    },
    [onChange]
  );

  const select = useCallback((index: number) => syncTo(index, true, null), [syncTo]);

  const scrollHandlers = useMemo(
    () =>
      carousels.map(
        (_, driver): PointerDragHandlers => ({
          onScrollPreview: (index) => syncTo(index, false, driver),
          onRelease: (index) => syncTo(index, true, driver),
        })
      ),
    [carousels, syncTo]
  );

  useEffect(() => {
    carouselsRef.current = carousels;
    syncTo(activeIndexRef.current, false, null);
  }, [carousels, syncTo]);

  useEffect(() => {
    syncTo(initialIndex, false, null);
  }, [initialIndex, syncTo]);

  return { activeIndex, select, scrollHandlers };
}
