import { Container } from "@/modules/marketing/ui/Container";
import { Section } from "@/modules/marketing/ui/Section";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/Typography";
import { Button } from "@/shared/ui/button/Button";
import { Sparkles } from "@/shared/ui/icon/lucide-icons";
import type { FeatureCarouselFeature } from "./components/FeatureCarousel";
import { FeatureCarousel } from "./components/FeatureCarousel";

import feature01 from "./media/feature_01.webp";
import feature02 from "./media/feature_02.webp";
import feature03 from "./media/feature_03.webp";

const BENEFITS = [
  {
    title: "Build a day-by-day itinerary",
    description:
      "Add activities, times, notes, and addresses, then drag cards between days as the plan changes.",
    imgSrc: feature01.src,
  },
  {
    title: "See your trip on the map",
    description:
      "View activities with coordinates on one interactive map and switch back to the timeline when needed.",
    imgSrc: feature02.src,
  },
  {
    title: "Keep costs visible",
    description: "Add expenses by category and see the totals update as you make decisions.",
    imgSrc: feature03.src,
  },
] satisfies FeatureCarouselFeature[];

export function KeyBenefits() {
  return (
    <Section>
      <Container id="features" className="scroll-mt-24">
        <Eyebrow>
          <Sparkles className="size-4" aria-hidden="true" />
          Key benefits
        </Eyebrow>
        <H2>Itinerary. Map. Budget.</H2>
        <P>Keep the practical parts of a trip connected, from the first activity to the final expense.</P>
        <Button href="/signup">Start planning</Button>
      </Container>
      <FeatureCarousel features={BENEFITS} />
    </Section>
  );
}
