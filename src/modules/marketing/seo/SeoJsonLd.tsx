import { SITE_URL } from "@/shared/utils/siteUrl";

export default function SeoJsonLd() {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Turistar",
    url: SITE_URL,
  } as const;

  const application = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Turistar",
    url: SITE_URL,
    applicationCategory: "TravelApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    description:
      "A travel planner for day-by-day itineraries, interactive maps, budgets, and shared planning.",
    featureList: ["Drag-and-drop itinerary", "Interactive map", "Budget tracking", "Shared planning"],
  } as const;

  return (
    <>
      <script
        type="application/ld+json"
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script payload */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script payload */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(application) }}
      />
    </>
  );
}
