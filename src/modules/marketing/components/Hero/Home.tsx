import Image from "next/image";
import { Eyebrow, H1, P } from "@/modules/marketing/ui/typography";
import { Container, Section } from "@/modules/marketing/ui/wrapper";
import { Button } from "@/shared/ui/button";
import heroMock from "./media/hero-app-mock.webp";

export function HeroHome() {
  return (
    <Section variant="card">
      <Container size="wide" className="gap-16 lg:grid-cols-2">
        <div className="space-y-4">
          <Eyebrow>Free and open source</Eyebrow>
          <H1>Plan trips together, all in one place.</H1>
          <P>
            Build a day-by-day itinerary, map every stop, and track the budget with your travel companions.
            Itinerary changes stay in sync in real time.
          </P>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" href="/signup">
              Create a free plan
            </Button>
            <Button className="w-full sm:w-auto" href="/p/xGAJQ3na6Zlh" variant="ghost">
              View a sample itinerary
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-[min(1003px,100%)] justify-self-center lg:mx-0 lg:mr-[calc(50%-50vw-1.5rem)] lg:max-w-none lg:justify-self-auto">
          <div className="border-default bg-muted/30 block rounded-2xl border border-dashed p-1">
            <Image
              src={heroMock}
              alt="Turistar itinerary with activities, map stops, and trip budget"
              className="block"
              width={1003}
              height={522}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
