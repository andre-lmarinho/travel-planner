import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { PlusDivider } from "./Divider";

type SectionVariant = "transparent" | "card" | "flush";

interface SectionProps {
  children: ReactNode;
  variant?: SectionVariant;
  className?: string;
}

export function Section({ children, variant = "transparent" }: SectionProps) {
  return (
    <>
      <div className="group/section mx-3">
        <div className="mx-auto h-full w-full max-w-[1200px] border-x px-3 group-first/section:pt-24">
          <div
            className={cn(
              "relative",
              variant === "card" &&
                "border-border bg-card overflow-hidden rounded-xl border shadow-[rgba(36,36,36,0.7)_0px_1px_5px_-4px,rgba(36,36,36,0.05)_0px_4px_8px_0px]"
            )}>
            <section
              className={cn(
                "mx-auto w-full max-w-[1048px]",
                variant !== "flush" && "space-y-12 py-[clamp(48px,5vw,96px)]"
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
