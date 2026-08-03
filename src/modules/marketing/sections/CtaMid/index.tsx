import { Container } from "@/modules/marketing/ui/Container";
import { Section } from "@/modules/marketing/ui/Section";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/Typography";
import { Button } from "@/shared/ui/button/Button";
import { Map as MapIcon } from "@/shared/ui/icon/lucide-icons";

import { EmojiTicker } from "./components/EmojiTicker";

export function CtaMid() {
  return (
    <Section variant="card">
      <Container size="wide" className="gap-16 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Eyebrow>
            <MapIcon className="size-4" aria-hidden="true" />
            One web app
          </Eyebrow>
          <H2>Your itinerary, map, and budget stay connected</H2>
          <P>
            Add trip dates, activities, locations, and expenses in the same planner, then return whenever
            plans change.
          </P>
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <Button href="/signup">Start planning</Button>
            <Button href="/login" variant="ghost">
              Log in
            </Button>
          </div>
        </div>

        <EmojiTicker />
      </Container>
    </Section>
  );
}
