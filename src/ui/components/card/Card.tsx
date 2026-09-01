import Link from "next/link";
import { cn } from "@/ui/utils/cn";

type CardProps = {
  href: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
};

export function Card({ href, title, description, image, className }: CardProps) {
  const isPrepared = image && (image.includes("url(") || image.startsWith("linear-gradient"));
  // Quoted so characters CSS treats specially in bare url() — e.g. the ")" in
  // Wikimedia filenames like "Rome Skyline (8012016319).jpg" — can't end it early.
  const bg = image
    ? isPrepared
      ? image
      : `url("${image.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`
    : "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)";

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-48 w-full overflow-hidden rounded-xl bg-muted shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: bg,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent"
      />
      <div className="relative mt-auto w-full p-3">
        <div className="border-background/70 rounded-lg border bg-background/95 px-3 py-2.5 shadow-sm backdrop-blur-sm">
          <p className="truncate text-sm font-semibold">{title}</p>
          {description ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{description}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
