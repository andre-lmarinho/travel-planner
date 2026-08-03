import { Collaboration } from "@/modules/marketing/sections/Collaboration";
import { CtaFinal } from "@/modules/marketing/sections/CtaFinal";
import { CtaMid } from "@/modules/marketing/sections/CtaMid";
import { HeroHome } from "@/modules/marketing/sections/Hero/Home";
import { HowItWorks } from "@/modules/marketing/sections/HowItWorks";
import { Inspiration } from "@/modules/marketing/sections/Inspiration";
import { KeyBenefits } from "@/modules/marketing/sections/KeyBenefits";

export default function MarketingHomePage() {
  return (
    <>
      <HeroHome />
      <KeyBenefits />
      <HowItWorks />
      <CtaMid />
      <Collaboration />
      <Inspiration />
      <CtaFinal />
    </>
  );
}
