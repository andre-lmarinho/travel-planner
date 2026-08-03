import { getPublicPlans } from "@/features/plan/lib/getPublicPlans";
import { Container } from "@/modules/marketing/ui/Container";
import { Section } from "@/modules/marketing/ui/Section";
import { H2, P } from "@/modules/marketing/ui/Typography";
import { Card } from "@/shared/ui/card/Card";

export async function Inspiration() {
  const plans = await getPublicPlans();

  if (plans.length === 0) return null;

  return (
    <Section>
      <Container id="inspiration" className="scroll-mt-24">
        <H2>Explore trips shared by other travelers</H2>
        <P>Open a published itinerary to see how another trip is organized.</P>
      </Container>

      <ul className="mx-auto flex flex-wrap justify-center gap-6">
        {plans.map((plan) => (
          <li key={plan.id}>
            <Card
              className="w-56 sm:w-60 md:w-64"
              title={plan.title}
              href={`/p/${plan.publicSlug}`}
              image={plan.coverImage ?? undefined}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
