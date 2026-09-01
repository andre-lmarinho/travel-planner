import { SITE_URL } from "@/lib/urls/siteUrl";

const logoUrl = `${SITE_URL}/favicon.ico`;

export default function SeoJsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Turistar",
    url: SITE_URL,
    logo: logoUrl,
  } as const;

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Turistar",
    url: SITE_URL,
  } as const;

  return (
    <>
      <script
        type="application/ld+json"
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script payload */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
      <script
        type="application/ld+json"
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script payload */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
