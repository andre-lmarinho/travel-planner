import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const containerVariants = cva("mx-auto grid w-full grid-cols-1 gap-4 px-3", {
  variants: {
    size: {
      base: "max-w-[50em] place-items-center text-center",
      wide: "max-w-[70em] place-items-stretch text-left",
    },
  },
  defaultVariants: { size: "base" },
});

type Props = React.ComponentProps<"div"> & VariantProps<typeof containerVariants>;

export function Container({ size, className, ...rest }: Props) {
  return <div className={cn(containerVariants({ size }), className)} {...rest} />;
}
