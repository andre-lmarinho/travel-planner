import { CTAButton } from "@/modules/marketing/ui/button";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/typography";
import { Container, Section } from "@/modules/marketing/ui/wrapper";
import { Accordion } from "@/shared/ui/accordion";
import { CircleQuestionMark } from "@/shared/ui/icon";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  items: FaqItem[];
  description?: string;
}

export function Faq({
  items,
  description = "These are some of our most frequently asked questions.",
}: FaqProps) {
  const accordionItems = items.map((item) => ({
    value: item.question,
    trigger: item.question,
    content: <P>{item.answer}</P>,
  }));

  return (
    <Section>
      <Container id="faq">
        <Eyebrow>
          <CircleQuestionMark className="size-4" aria-hidden="true" />
          FAQ
        </Eyebrow>
        <H2>Frequently asked questions</H2>
        <P>{description}</P>
        <CTAButton />
      </Container>
      <Accordion items={accordionItems} />
    </Section>
  );
}
