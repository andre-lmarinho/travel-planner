import Link from "next/link";

import { Logo } from "@/shared/ui/logo";

const FOOTER_LINK_CLASS = "hover:opacity-70";
const EXTERNAL_LINK_CLASS = "underline underline-offset-2 hover:opacity-70";

const USE_CASE_LINKS = [
  { href: "/planning/adventure", label: "Adventure" },
  { href: "/planning/digital-nomad", label: "Digital Nomad" },
  { href: "/planning/event-based", label: "Event" },
  { href: "/planning/family", label: "Family" },
  { href: "/planning/road-trip", label: "Road Trip" },
  { href: "/planning/vacation", label: "Vacation" },
] as const;

const RESOURCE_LINKS = [
  { href: "/planning", label: "Planning Hub" },
  { href: "/#inspiration", label: "Inspirations" },
  { href: "/friends", label: "Friends" },
] as const;

export function Footer() {
  return (
    <footer className="mx-3 py-16">
      <div className="mx-auto grid h-full w-full max-w-300 grid-cols-1 gap-8 md:grid-cols-[2fr_2fr]">
        <div>
          <Logo href="/" />
          <p className="mt-5 px-2">
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
            className={`px-2 ${EXTERNAL_LINK_CLASS}`}
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </a>
        </div>
        <div className="grid grid-cols-2 gap-6 px-2">
          <nav aria-label="Use cases" className="flex flex-col gap-2">
            <p className="font-semibold">Use Cases</p>
            {USE_CASE_LINKS.map((link) => (
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
