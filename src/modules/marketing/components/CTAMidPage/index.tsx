import { CTAButtons } from "@/modules/marketing/ui/button";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/typography";
import { Container, Section } from "@/modules/marketing/ui/wrapper";
import { Map as MapIcon } from "@/shared/ui/icon";

import { EmojiTicker } from "./components/EmojiTicker";

export function CtaMidPage() {
  return (
    <Section variant="card">
      <Container size="wide" className="gap-16 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Eyebrow>
            <MapIcon className="size-4" aria-hidden="true" />
            Web app
          </Eyebrow>
          <H2>All your trip details in-sync with your itinerary</H2>
          <P>
            Turistar keeps dates, budgets, maps, and activities in one flow so everything works perfectly
            together.
          </P>
          <CTAButtons />
        </div>

        <EmojiTicker />
      </Container>
    </Section>
  );
}
