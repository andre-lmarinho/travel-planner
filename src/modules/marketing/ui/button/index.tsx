import { Button } from "@/shared/ui/button";

export function CTAButton() {
  return <Button href="/signup">Get started</Button>;
}

export function CTAButtons() {
  return (
    <div className="flex flex-row items-center justify-start gap-3">
      <CTAButton />
      <Button href="/p/xGAJQ3na6Zlh" variant="ghost">
        View a sample itinerary
      </Button>
    </div>
  );
}
