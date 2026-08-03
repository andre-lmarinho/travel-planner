import Image from "next/image";
import { Container } from "@/modules/marketing/ui/Container";
import { Section } from "@/modules/marketing/ui/Section";
import { H2 } from "@/modules/marketing/ui/Typography";
import { Button } from "@/shared/ui/button/Button";
import backgroundImage from "./media/background.webp";

export function CtaFinal() {
  return (
    <Section variant="card">
      <Container className="relative gap-8">
        <H2 className="z-1">Turn the trip idea into a shared itinerary</H2>
        <Button className="z-1" href="/signup">
          Create a free trip
        </Button>
        <Image
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          role="presentation"
          fill
          sizes="(min-width: 1200px) 1048px, calc(100vw - 48px)"
          className="pointer-events-none object-cover select-none"
          draggable={false}
        />
      </Container>
    </Section>
  );
}
