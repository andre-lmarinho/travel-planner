import { CTAButton } from "@/modules/marketing/ui/button";
import { Eyebrow, H2, P } from "@/modules/marketing/ui/typography";
import { Container, Section } from "@/modules/marketing/ui/wrapper";
import { Binoculars, CircleCheck } from "@/shared/ui/icon";

export interface FeatureItem {
  title: string;
  description: string;
}

const DEFAULT_FEATURE_ITEMS: readonly FeatureItem[] = [
  {
    title: "Date Picker",
    description: "Set start and end dates quickly to build a clear schedule.",
  },
  {
    title: "Destination Search",
    description: "Find attractions fast with autocomplete powered by Geoapify search.",
  },
  {
    title: "Sample Plans",
    description: "Browse sample trips for inspiration and duplicate ones you like.",
  },
  {
    title: "Responsive Design",
    description: "Use the planner comfortably on phones, tablets and desktops.",
  },
  {
    title: "Data Storage",
    description: "Every change is saved instantly, so your plans never disappear.",
  },
  {
    title: "Cloning Trips",
    description: "Copy itineraries from other travellers and make them your own.",
  },
];

interface FeaturesProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: readonly FeatureItem[];
}

export function Features({
  eyebrow = "Additional features",
  title = "Extra planning tools",
  description = "Enhance your trips with these helpful tools that streamline planning, mapping and budgeting.",
  items = DEFAULT_FEATURE_ITEMS,
}: FeaturesProps = {}) {
  return (
    <Section>
      <Container id="features">
        <Eyebrow>
          <Binoculars className="size-4" aria-hidden="true" />
          {eyebrow}
        </Eyebrow>
        <H2>{title}</H2>
        <P>{description}</P>
        <CTAButton />
      </Container>
      <Container size="wide" className="gap-3 md:grid-cols-3">
        {items.map((feature) => (
          <article
            key={feature.title}
            className="bg-muted/40 border-border h-full rounded-xl border p-6 text-left transition-shadow hover:shadow-md">
            <div className="flex flex-col">
              <h3 className="text-lg leading-[1.3] font-bold">
                <span className="text-foreground inline-flex items-center gap-2">
                  <CircleCheck className="size-4" aria-hidden="true" />
                  {feature.title}
                </span>
              </h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          </article>
        ))}
      </Container>
    </Section>
  );
}
