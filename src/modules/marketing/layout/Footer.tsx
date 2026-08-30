import Link from "next/link";

import { Logo } from "@/shared/ui/logo";

const FOOTER_LINK_CLASS = "hover:opacity-70";
const EXTERNAL_LINK_CLASS = "underline underline-offset-2 hover:opacity-70";

const PRODUCT_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#inspiration", label: "Inspiration" },
  { href: "/#faq", label: "FAQ" },
] as const;

const RESOURCE_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="mx-3 py-16">
      <div className="mx-auto grid h-full w-full max-w-300 grid-cols-1 gap-8 md:grid-cols-[2fr_2fr]">
        <div>
          <Logo href="/" />
          <p className="mt-5 px-2">Plan trips together with your itinerary, map, and budget in one place.</p>
          <p className="mt-3 px-2">
            {"Made with "}
            <span aria-label="heart" role="img">
              ❤️
            </span>
            {" by "}
            <a
              href="https://andremarinho.me/"
              className={EXTERNAL_LINK_CLASS}
              target="_blank"
              rel="noopener noreferrer">
              André Marinho
            </a>
          </p>
          <a
            href="https://github.com/andre-lmarinho/turistar"
            className={`mt-2 inline-block px-2 ${EXTERNAL_LINK_CLASS}`}
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </a>
          <a href="mailto:support@turistar.me" className={`mt-2 inline-block px-2 ${EXTERNAL_LINK_CLASS}`}>
            Support
          </a>
        </div>
        <div className="grid grid-cols-2 gap-6 px-2">
          <nav aria-label="Product" className="flex flex-col gap-2">
            <p className="font-semibold">Product</p>
            {PRODUCT_LINKS.map((link) => (
              <Link key={link.href} className={FOOTER_LINK_CLASS} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Resources" className="flex flex-col gap-2">
            <p className="font-semibold">Resources</p>
            {RESOURCE_LINKS.map((link) => (
              <Link key={link.href} className={FOOTER_LINK_CLASS} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
