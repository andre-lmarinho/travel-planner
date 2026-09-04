const SCALE = 1024;

export function parsePosition(position?: string): number | null {
  if (!position?.trim()) return null;
  const num = Number(position);
  return Number.isFinite(num) ? num : null;
}

export function midpoint(left?: string, right?: string): string {
  const leftVal = parsePosition(left) ?? 0;
  const rightVal = parsePosition(right) ?? 0;
  if (!right && !left) return String(SCALE);
  if (!right) return String(leftVal + SCALE);
  if (!left) return String(rightVal / 2 || SCALE);
  // When equal, return the same value - caller should trigger rebalance via normalizePositions
  if (leftVal === rightVal) return String(leftVal);
  return String((leftVal + rightVal) / 2);
}

export function normalizePositions<T extends { position?: string }>(items: T[]): T[] {
  let mutated = false;
  const result = items.map((item, index) => {
    if (item.position != null && item.position !== "") return item;
    mutated = true;
    return {
      ...item,
      position: String((index + 1) * SCALE),
    };
  });
  return mutated ? result : items;
}
