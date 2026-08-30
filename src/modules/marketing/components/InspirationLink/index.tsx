import { getPublicPlans } from "@/features/plan/lib/getPublicPlans";
import { H2, P } from "@/modules/marketing/ui/typography";
import { Container, Section } from "@/modules/marketing/ui/wrapper";
import { Card } from "@/shared/ui/card";

export async function InspirationLink() {
  const plans = await getPublicPlans();

  // Nothing public yet (or the discovery query degraded): omit the section rather than render an
  // empty grid.
  if (plans.length === 0) return null;

  return (
    <Section>
      <Container id="inspiration">
        <H2>Be inspired by fellow travelers</H2>
        <P>Explore public trip itineraries from other travelers and get inspired for your next trip.</P>
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
