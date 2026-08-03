import { Container } from "@/modules/marketing/ui/Container";
import { Section } from "@/modules/marketing/ui/Section";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/Typography";

const PLANNING_STEPS = [
  {
    title: "Set the trip",
    description:
      "Choose a destination and dates. Turistar creates the days so you can start with a clear timeline.",
  },
  {
    title: "Shape the itinerary",
    description:
      "Add activities, times, notes, addresses, and costs. Drag cards between days whenever plans change.",
  },
  {
    title: "Share when ready",
    description:
      "Invite people to collaborate or publish a read-only itinerary that anyone with the link can view.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section variant="card">
      <Container id="how-it-works" className="scroll-mt-24">
        <Eyebrow>How it works</Eyebrow>
        <H2>From destination to shared plan in three steps</H2>
        <P>No templates to configure and no spreadsheet to maintain.</P>
      </Container>

      <Container size="wide" className="gap-3 md:grid-cols-3">
        {PLANNING_STEPS.map((step, index) => (
          <article key={step.title} className="border-border bg-background rounded-xl border p-6">
            <span className="text-primary text-sm font-semibold tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{step.description}</p>
          </article>
        ))}
      </Container>
    </Section>
  );
}
