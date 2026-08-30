import { cn } from "@/shared/utils/cn";

type MenuToggleButtonProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function MenuToggleButton({ isOpen, onToggle }: MenuToggleButtonProps) {
  return (
    <button
      type="button"
      className="focus-visible:ring-primary/60 relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
      onClick={onToggle}
      aria-label={isOpen ? "Close navigation" : "Open navigation"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation">
      <span
        className={cn(
          "bg-foreground absolute h-0.5 w-5 rounded-lg transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0 rotate-45" : "-translate-y-2"
        )}
      />
      <span
        className={cn(
          "bg-foreground absolute h-0.5 w-5 rounded-lg transition-opacity duration-200 ease-in-out",
          isOpen ? "opacity-0" : "opacity-100"
        )}
      />
      <span
        className={cn(
          "bg-foreground absolute h-0.5 w-5 rounded-lg transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0 -rotate-45" : "translate-y-2"
        )}
      />
    </button>
  );
}
