import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { PlusDivider } from "./Divider";

type SectionVariant = "transparent" | "card" | "flush";

interface SectionProps {
  children: ReactNode;
  variant?: SectionVariant;
  className?: string;
}

export function Section({ children, variant = "transparent", className }: SectionProps) {
  return (
    <>
      <div className="group/section mx-3">
        <div className="mx-auto h-full w-full max-w-7xl border-x px-3 group-first/section:pt-24">
          <div
            className={cn(
              "relative",
              variant === "card" && "border-border bg-card overflow-hidden rounded-xl border shadow-sm"
            )}>
            <section
              className={cn(
                "mx-auto w-full max-w-5xl",
                variant !== "flush" && "space-y-12 py-[clamp(48px,5vw,96px)]",
                className
              )}>
              {children}
            </section>
          </div>
        </div>
      </div>

      <PlusDivider />
    </>
  );
}
