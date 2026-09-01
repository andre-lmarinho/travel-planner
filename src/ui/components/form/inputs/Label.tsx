import { cn } from "@/ui/utils/cn";

export function Label(props: JSX.IntrinsicElements["label"]) {
  const { className, htmlFor, children, ...restProps } = props;

  return (
    <label
      {...restProps}
      htmlFor={htmlFor}
      className={cn("text-foreground mb-2 block text-sm font-medium leading-none", className)}>
      {children}
    </label>
  );
}
