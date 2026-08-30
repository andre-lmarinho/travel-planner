"use client";

import Image from "next/image";
import { H2 } from "@/modules/marketing/ui/typography";
import { Container, Section } from "@/modules/marketing/ui/wrapper";
import { Button } from "@/shared/ui/button";
import backgroundImage from "./media/background.webp";

export function CtaFinal() {
  return (
    <Section variant="card">
      <Container className="gap-8">
        <H2 className="z-1">Start planning together</H2>
        <Button href="/signup">Get started</Button>
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
