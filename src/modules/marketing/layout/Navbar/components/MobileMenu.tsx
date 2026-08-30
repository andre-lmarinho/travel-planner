import Link from "next/link";
import { NAV_LINKS } from "../data";

const MOBILE_MENU_LINK_CLASS =
  "text-foreground hover:text-primary flex w-full items-center justify-between text-left p-4 text-[15px] font-semibold transition-colors";

type MobileMenuProps = {
  onClose: () => void;
};

export function MobileMenu({ onClose }: MobileMenuProps) {
  return (
    <nav
      id="mobile-navigation"
      aria-label="Mobile navigation"
      className="bg-background fixed inset-x-0 top-12 z-40 h-dvh overflow-y-auto pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={MOBILE_MENU_LINK_CLASS} onClick={onClose}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
