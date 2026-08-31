import { Plus } from "@/shared/ui/icon";

export const PlusDivider = () => (
  <span className="before:bg-border relative flex h-8 w-full items-center before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2">
    <div className="relative z-10 mx-auto flex w-full max-w-306 items-center justify-between">
      <span className="bg-background">
        <Plus aria-hidden className="text-border size-6" />
      </span>
      <span className="bg-background">
        <Plus aria-hidden className="text-border size-6" />
      </span>
    </div>
  </span>
);
