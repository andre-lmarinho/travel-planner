import clsx from "clsx";
import Link from "next/link";

type LogoProps = {
  href: string;
  className?: string;
};

export function Logo({ href, className }: LogoProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "text-foreground inline-flex items-center gap-2 justify-self-start rounded-lg px-2 pb-2 text-lg font-semibold tracking-tight md:text-xl",
        className
      )}>
      <span className="after:bg-primary/70 relative inline-flex items-center after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-lg">
        Turistar
      </span>
    </Link>
  );
}
