import Link from "next/link";
import { Button } from "@/shared/ui/button/Button";
import { NAV_LINKS } from "../data";

const MOBILE_MENU_LINK_CLASS =
  "text-foreground hover:text-primary focus-visible:ring-primary/60 flex w-full rounded-lg p-4 text-[15px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none";

interface MobileMenuProps {
  plannerHref: string | null;
  onClose: () => void;
}

export function MobileMenu({ plannerHref, onClose }: MobileMenuProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="bg-background fixed inset-x-0 top-14 z-40 overflow-y-auto border-b px-3 pt-4 pb-6 lg:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={MOBILE_MENU_LINK_CLASS} onClick={onClose}>
            {link.label}
          </Link>
        ))}

        <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-4">
          {plannerHref ? (
            <Button className="col-span-2" href={plannerHref} variant="accent" onClick={onClose}>
              Go to planner
            </Button>
          ) : (
            <>
              <Button href="/login" variant="ghost" onClick={onClose}>
                Log in
              </Button>
              <Button href="/signup" onClick={onClose}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
