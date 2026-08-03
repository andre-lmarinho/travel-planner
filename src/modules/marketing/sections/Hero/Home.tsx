import Image from "next/image";
import { Container } from "@/modules/marketing/ui/Container";
import { Section } from "@/modules/marketing/ui/Section";
import { Eyebrow, H1, P } from "@/modules/marketing/ui/Typography";
import { Button } from "@/shared/ui/button/Button";
import heroMock from "./media/hero-app-mock.webp";

export function HeroHome() {
  return (
    <Section variant="card">
      <Container size="wide" className="gap-16 lg:grid-cols-2">
        <div className="space-y-4">
          <Eyebrow>Free and open-source travel planner</Eyebrow>
          <H1>Plan the whole trip in one place.</H1>
          <P>
            Build a day-by-day itinerary, see every stop on the map, track costs, and invite friends to plan
            with you in your browser.
          </P>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" href="/signup">
              Create a free trip
            </Button>
            <Button className="w-full sm:w-auto" href="/login" variant="ghost">
              Log in
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-[min(1003px,100%)] justify-self-center lg:mx-0 lg:mr-[calc(50%-50vw-1.5rem)] lg:max-w-none lg:justify-self-auto">
          <div className="border-default bg-muted/30 block rounded-2xl border border-dashed p-1">
            <Image
              src={heroMock}
              alt=""
              className="block"
              aria-hidden="true"
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
