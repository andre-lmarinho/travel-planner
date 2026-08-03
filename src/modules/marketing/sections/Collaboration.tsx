import { Container } from "@/modules/marketing/ui/Container";
import { Section } from "@/modules/marketing/ui/Section";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/Typography";
import { Button } from "@/shared/ui/button/Button";
import { CircleCheck, Share2 } from "@/shared/ui/icon/lucide-icons";

const COLLABORATION_POINTS = [
  "Invite members by email and manage their access.",
  "Keep the shared itinerary available to everyone in the plan.",
  "Publish a read-only version without exposing editing controls.",
] as const;

export function Collaboration() {
  return (
    <Section>
      <Container
        id="collaboration"
        size="wide"
        className="scroll-mt-24 gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div className="space-y-4">
          <Eyebrow>
            <Share2 className="size-4" aria-hidden="true" />
            Plan together
          </Eyebrow>
          <H2>One itinerary, shared with the right people</H2>
          <P>
            Keep the plan in one place while friends or travel companions contribute from their own accounts.
          </P>
          <Button href="/signup">Create a shared trip</Button>
        </div>

        <ul className="bg-muted/40 border-border space-y-3 rounded-xl border p-6">
          {COLLABORATION_POINTS.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-6">
              <CircleCheck className="text-primary mt-1 size-4 shrink-0" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
