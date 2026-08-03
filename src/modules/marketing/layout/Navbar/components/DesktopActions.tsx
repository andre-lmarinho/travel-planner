import { Button } from "@/shared/ui/button/Button";

interface DesktopActionsProps {
  plannerHref: string | null;
}

export function DesktopActions({ plannerHref }: DesktopActionsProps) {
  return (
    <div className="ml-auto hidden items-center gap-3 lg:flex lg:ml-0 lg:justify-self-end">
      {plannerHref ? (
        <Button href={plannerHref} variant="accent">
          Go to planner
        </Button>
      ) : (
        <>
          <Button href="/login" variant="ghost">
            Log in
          </Button>
          <Button href="/signup">Get started</Button>
        </>
      )}
    </div>
  );
}
