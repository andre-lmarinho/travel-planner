import { cn } from "@/ui/utils/cn";

type AvatarProps = {
  displayName: string | null;
  size?: "sm" | "lg";
};

export function Avatar({ displayName, size = "sm" }: AvatarProps) {
  const initial = displayName?.trim().charAt(0)?.toUpperCase() || "T";
  const sizeClasses = size === "lg" ? "h-8 w-8 p-2 text-base" : "h-6 w-6 p-1 text-xs";

  return (
    <div
      className={cn(
        "border-border bg-muted text-foreground inline-flex items-center justify-center rounded-full border font-semibold",
        sizeClasses
      )}>
      {initial}
    </div>
  );
}
