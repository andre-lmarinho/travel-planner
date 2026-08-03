import Link from "next/link";
import { NAV_LINKS } from "../data";

export function DesktopNavigation() {
  return (
    <nav aria-label="Main navigation" className="hidden lg:block">
      <ul className="flex list-none items-center gap-1 p-0">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/60 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
