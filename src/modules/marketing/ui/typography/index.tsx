import { cn } from "@/shared/utils/cn";

export function Eyebrow(props: React.ComponentProps<"p">) {
  const { className, ...rest } = props;
  return (
    <p
      className={cn(
        "pointer-events-none inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tracking-wide select-none",
        "text-primary bg-primary/10",
        className
      )}
      {...rest}
    />
  );
}

export function H1(props: React.ComponentProps<"h1">) {
  const { className, ...rest } = props;
  return (
    <h1
      className={cn("text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl lg:text-6xl", className)}
      {...rest}
    />
  );
}

export function H2(props: React.ComponentProps<"h2">) {
  const { className, ...rest } = props;
  return (
    <h2
      className={cn("text-3xl leading-[1.1] font-bold tracking-tight md:text-4xl lg:text-5xl", className)}
      {...rest}
    />
  );
}

export function H3(props: React.ComponentProps<"h3">) {
  const { className, ...rest } = props;
  return <h3 className={cn("text-2xl font-semibold tracking-tight md:text-3xl", className)} {...rest} />;
}

export function P(props: React.ComponentProps<"p">) {
  const { className, ...rest } = props;
  return (
    <p className={cn("text-muted-foreground text-base leading-relaxed lg:text-lg", className)} {...rest} />
  );
}
