import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import { scrollToChild } from "../utils/scrollToChild";

export type PointerDragHandlers = {
  onRelease?: (nearestIndex: number) => void;
  onDragStart?: () => void;
  onScrollPreview?: (nearestIndex: number) => void;
};

const MAX_OVERSHOOT_PX = 64;

export function usePointerDragScroll(
  ref: RefObject<HTMLUListElement | null>,
  opts?: PointerDragHandlers,
  enabled: boolean = true
) {
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const startIdxRef = useRef(0);
  const overshootRef = useRef(0);
  const itemsMetricsRef = useRef<{
    count: number;
    centers: number[];
    widths: number[];
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const el = ref.current;
    if (!el) return;

    const measureItems = () => {
      const items = Array.from(el.children) as HTMLElement[];
      const count = items.length;
      if (!count) {
        itemsMetricsRef.current = { count: 0, centers: [], widths: [] };
        return itemsMetricsRef.current;
      }

      const centers = new Array<number>(count);
      const widths = new Array<number>(count);
      const parentRect = el.getBoundingClientRect();
      const scrollLeft = el.scrollLeft;

      for (let idx = 0; idx < count; idx += 1) {
        const it = items[idx];
        const rect = it.getBoundingClientRect();
        const width = rect.width;
        widths[idx] = width;
        const offsetLeft = rect.left - parentRect.left + scrollLeft;
        centers[idx] = offsetLeft + width / 2;
      }

      const metrics = { count, centers, widths };
      itemsMetricsRef.current = metrics;
      return metrics;
    };

    const getMetrics = (force = false) => {
      if (force || !itemsMetricsRef.current) {
        return measureItems();
      }

      const items = el.children.length;
      if (itemsMetricsRef.current.count !== items) {
        return measureItems();
      }

      return itemsMetricsRef.current;
    };

    const nearestIndex = (force = false) => {
      const metrics = getMetrics(force);
      if (!metrics.count) return 0;

      const center = el.scrollLeft + el.clientWidth / 2;
      let bestIdx = 0;
      let best = Infinity;
      for (let idx = 0; idx < metrics.count; idx += 1) {
        const itemCenter = metrics.centers[idx];
        const distance = Math.abs(center - itemCenter);
        if (distance < best) {
          best = distance;
          bestIdx = idx;
        }
      }
      return bestIdx;
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      measureItems();
      draggingRef.current = true;
      el.setPointerCapture?.(e.pointerId);
      startXRef.current = e.clientX;
      startScrollRef.current = el.scrollLeft;
      startIdxRef.current = nearestIndex();
      overshootRef.current = 0;
      el.style.transform = "";
      el.classList.add("is-dragging");
      opts?.onDragStart?.();
    };

    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const delta = e.clientX - startXRef.current;
      let next = startScrollRef.current - delta;
      const max = el.scrollWidth - el.clientWidth;
      if (next < 0 || next > max) {
        const overshoot = next < 0 ? next : next - max;
        // Clamp the bounce so the preview never stretches beyond its frame.
        const maxOvershoot = Math.max(12, Math.min(MAX_OVERSHOOT_PX, el.clientWidth * 0.15));
        const easedOvershoot = Math.max(Math.min(-overshoot * 0.35, maxOvershoot), -maxOvershoot);
        overshootRef.current = easedOvershoot;
        el.style.transform = `translateX(${easedOvershoot}px)`;
        next = next < 0 ? 0 : max;
      } else {
        overshootRef.current = 0;
        el.style.transform = "";
      }
      el.scrollLeft = next;
      opts?.onScrollPreview?.(nearestIndex());
    };

    const up = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {}
      el.classList.remove("is-dragging");

      if (overshootRef.current !== 0) {
        el.style.transition = "transform 200ms ease-out";
        el.style.transform = "translateX(0)";
        const clear = () => {
          el.style.transition = "";
          el.removeEventListener("transitionend", clear);
        };
        el.addEventListener("transitionend", clear);
      }

      const delta = e.clientX - startXRef.current;
      const threshold = 40;
      const maxIdx = el.children.length - 1;
      let idx = nearestIndex(true);

      if (Math.abs(delta) > threshold) {
        const direction = delta < 0 ? 1 : -1;
        idx = Math.min(Math.max(startIdxRef.current + direction, 0), maxIdx);
      }

      scrollToChild(el, idx, { smooth: true, disableSnap: true, duration: 600 });
      opts?.onRelease?.(idx);
      itemsMetricsRef.current = null;
    };

    const handleResize = () => {
      itemsMetricsRef.current = null;
      if (draggingRef.current) {
        measureItems();
      }
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("resize", handleResize);

    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("resize", handleResize);
      itemsMetricsRef.current = null;
    };
  }, [ref, opts, enabled]);
}
