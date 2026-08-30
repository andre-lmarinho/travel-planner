import { CTAButton } from "@/modules/marketing/ui/button";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/typography";
import { Container, Section } from "@/modules/marketing/ui/wrapper";
import { Sparkles } from "@/shared/ui/icon";
import type { FeatureCarouselFeature } from "./components/FeatureCarousel";
import { FeatureCarousel } from "./components/FeatureCarousel";

import feature01 from "./media/feature_01.webp";
import feature02 from "./media/feature_02.webp";
import feature03 from "./media/feature_03.webp";

const CAROUSEL_IMAGE_SOURCES = [feature01.src, feature02.src, feature03.src] as const;

type KeyBenefit = Pick<FeatureCarouselFeature, "title" | "description">;

export interface KeyBenefitsProps {
  title: string;
  description: string;
  benefits: KeyBenefit[];
}

export function KeyBenefits({ title, description, benefits }: KeyBenefitsProps) {
  const carouselFeatures: FeatureCarouselFeature[] = benefits.map((benefit, index) => ({
    ...benefit,
    imgSrc: CAROUSEL_IMAGE_SOURCES[index % CAROUSEL_IMAGE_SOURCES.length],
  }));

  return (
    <Section>
      <Container>
        <Eyebrow>
          <Sparkles className="size-4" aria-hidden="true" />
          Key benefits
        </Eyebrow>
        <H2>{title}</H2>
        <P>{description}</P>
        <CTAButton />
      </Container>
      <FeatureCarousel features={carouselFeatures} />
    </Section>
  );
}
