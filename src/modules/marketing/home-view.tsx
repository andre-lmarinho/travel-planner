import { CtaFinal } from "@/modules/marketing/components/CTAFinal";
import { CtaMidPage } from "@/modules/marketing/components/CTAMidPage";
import { Features } from "@/modules/marketing/components/Features";
import { HeroHome } from "@/modules/marketing/components/Hero/Home";
import { InspirationLink } from "@/modules/marketing/components/InspirationLink";
import type { KeyBenefitsProps } from "@/modules/marketing/components/KeyBenefits";
import { KeyBenefits } from "@/modules/marketing/components/KeyBenefits";
import { Faq } from "@/modules/marketing/components/PlanningFAQ";

interface HomeViewProps {
  keyBenefits: KeyBenefitsProps;
}

export function HomeView({ keyBenefits }: HomeViewProps) {
  return (
    <>
      <HeroHome />
      <KeyBenefits {...keyBenefits} />
      <InspirationLink />
      <Features
        eyebrow="Plan with confidence"
        title="Everything your trip needs"
        description="Keep the itinerary, map, and budget together while your group turns ideas into a real plan."
        items={[
          {
            title: "Visual itinerary",
            description: "Arrange activities by day and move them as plans change.",
          },
          {
            title: "Interactive map",
            description: "See each stop in context and understand the route at a glance.",
          },
          {
            title: "Shared budget",
            description: "Set a total, record expenses by category, and see what remains.",
          },
          {
            title: "Live itinerary updates",
            description: "Itinerary changes appear for your travel companions while you plan.",
          },
          {
            title: "Private by default",
            description: "Plans start private and become public only when you choose to share them.",
          },
        ]}
      />
      <Faq
        description="Answers about sharing, collaboration, licensing, and the current beta."
        items={[
          {
            question: "Is Turistar free?",
            answer:
              "The hosted beta is currently free. The source code is available under the AGPL-3.0 license; the software license and hosted-service terms are separate.",
          },
          {
            question: "Do my travel companions need an account?",
            answer:
              "Yes. Each companion needs a Turistar account and must be invited by email to edit a plan.",
          },
          {
            question: "Are my plans private?",
            answer:
              "Plans start private. When you mark a plan as public, it can appear in the Home and on a read-only public page.",
          },
          {
            question: "What updates in real time?",
            answer:
              "Itinerary changes sync live between companions. Other parts of the trip may need a refresh while the beta evolves.",
          },
        ]}
      />
      <CtaMidPage />
      <CtaFinal />
    </>
  );
}
