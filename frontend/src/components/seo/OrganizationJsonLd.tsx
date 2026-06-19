/*
 * File:    frontend/src/components/seo/OrganizationJsonLd.tsx
 * Purpose: schema.org Organization structured data (JSON-LD) injected on every
 *          page. Tells Google who Skillship is — name, logo, founder, contacts,
 *          and verified social profiles — so the brand + "founder" knowledge
 *          panel resolves to Skillship Edutech (Harsh Bhardwaj) rather than the
 *          unrelated "Skillship Foundation" results.
 * Owner:   Pranav
 */

import { siteConfig } from "@/config/site";

export function OrganizationJsonLd() {
  const { url, footer } = siteConfig;

  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Skillship Edutech",
    alternateName: "Skillship",
    url,
    logo: `${url}/logo.png`,
    image: `${url}/opengraph-image.png`,
    description: siteConfig.description,
    foundingDate: "2023",
    founder: {
      "@type": "Person",
      name: "Harsh Bhardwaj",
      jobTitle: "Founder & CEO",
    },
    email: footer.contact.email,
    telephone: footer.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Tajganj",
      addressLocality: "Agra",
      addressRegion: "Uttar Pradesh",
      postalCode: "282006",
      addressCountry: "IN",
    },
    sameAs: footer.socials.map((s) => s.href),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user input is interpolated.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
