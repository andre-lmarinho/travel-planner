import { Plus } from "@/shared/ui/icon";

export function GridMask() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="bg-border absolute inset-x-0 top-1/2 block h-px" />
      <span className="bg-border absolute inset-y-0 left-1/4 block w-px" />
      <span className="bg-border absolute inset-y-0 left-1/2 block w-px" />
      <span className="bg-border absolute inset-y-0 left-3/4 block w-px" />
      <Plus className="text-border bg-card absolute top-1/2 left-1/4 size-6 -translate-x-1/2 -translate-y-1/2" />
      <Plus className="text-border bg-card absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2" />
      <Plus className="text-border bg-card absolute top-1/2 left-3/4 size-6 -translate-x-1/2 -translate-y-1/2" />
    </span>
  );
}
