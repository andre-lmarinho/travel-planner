import Link from "next/link";
import { Logo } from "@/shared/ui/logo/Logo";

const FOOTER_LINK_CLASS =
  "text-muted-foreground hover:text-foreground focus-visible:ring-primary/60 rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";
const EXTERNAL_LINK_CLASS = "underline underline-offset-2 hover:opacity-70";

const PRODUCT_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#collaboration", label: "Plan together" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="mx-3 py-16">
      <div className="mx-auto grid h-full w-full max-w-300 grid-cols-1 gap-10 px-2 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo href="/" />
          <p className="text-muted-foreground mt-5">
            {"Built by "}
            <a
              href="https://andremarinho.me/"
              className={EXTERNAL_LINK_CLASS}
              target="_blank"
              rel="noopener noreferrer">
              André Marinho
            </a>
          </p>
          <a
            href="https://github.com/andre-lmarinho/travel-planner"
            className={EXTERNAL_LINK_CLASS}
            target="_blank"
            rel="noopener noreferrer">
            Source code
          </a>
        </div>

        <nav aria-label="Product" className="flex flex-col items-start gap-2">
          <p className="font-semibold">Product</p>
          {PRODUCT_LINKS.map((link) => (
            <Link key={link.href} className={FOOTER_LINK_CLASS} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Legal" className="flex flex-col items-start gap-2">
          <p className="font-semibold">Legal</p>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} className={FOOTER_LINK_CLASS} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
