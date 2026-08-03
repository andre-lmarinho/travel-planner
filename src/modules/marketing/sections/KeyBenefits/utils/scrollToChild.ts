export function scrollToChild(
  el: HTMLUListElement,
  idx: number,
  opts: { smooth?: boolean; disableSnap?: boolean; duration?: number } = {}
) {
  const { smooth = true, disableSnap = true, duration = 600 } = opts;
  const target = el.children[idx] as HTMLElement | undefined;
  if (!target) return;
  if (disableSnap) el.classList.add("no-snap");

  // Use bounding boxes to derive the scroll offset. This avoids relying on
  // `offsetLeft`, which can misreport values when flex gaps or transforms are
  // involved. Clamp the offset so the last slide sits flush with the container.
  const parentRect = el.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const rawLeft = targetRect.left - parentRect.left + el.scrollLeft;
  const max = el.scrollWidth - el.clientWidth;
  const left = Math.min(rawLeft, max);

  if (smooth) {
    const start = el.scrollLeft;
    const change = left - start;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t * (2 - t); // easeOutQuad
      el.scrollLeft = start + change * eased;
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (disableSnap) {
        el.classList.remove("no-snap");
      }
    };
    requestAnimationFrame(step);
  } else {
    el.scrollLeft = left;
    if (disableSnap) el.classList.remove("no-snap");
  }
}
