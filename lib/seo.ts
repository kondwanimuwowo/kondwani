import { SITE, SERVICES } from "@/data/site"

export type OgCardType = "page" | "project" | "case-study" | "blog"

// Static share images made in Canva, one per top-level page, in public/images/og
export type StaticOgPage = "home" | "projects" | "beyond-code" | "contact" | "blog"
export const staticOgUrl = (page: StaticOgPage) => `${SITE.url}/images/og/${page}.png`

// Pages use their static image; records get a generated card, with `version` busting caches when content changes
export function ogImage(type: OgCardType, slug: string, alt: string, version?: Date | null) {
  if (type === "page") return [{ url: staticOgUrl(slug as StaticOgPage), width: 1200, height: 630, alt }]
  const query = version ? `?v=${version.getTime()}` : ""
  return [{ url: `${SITE.url}/og/${type}/${encodeURIComponent(slug)}${query}`, width: 1200, height: 630, alt }]
}

// Pages must set their own twitter block, or they inherit the home card from the root layout
export function twitterCard(images: ReturnType<typeof ogImage>) {
  return { card: "summary_large_image" as const, creator: SITE.twitter, site: SITE.twitter, images }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  }
}

export const PERSON_ID = `${SITE.url}/#person`
export const BUSINESS_ID = `${SITE.url}/#business`
export const WEBSITE_ID = `${SITE.url}/#website`
export const PERSON_REF = { "@type": "Person", "@id": PERSON_ID, name: SITE.name, url: SITE.url }

export function siteGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: SITE.name,
        jobTitle: SITE.jobTitle,
        description: SITE.description,
        url: SITE.url,
        image: staticOgUrl("home"),
        sameAs: SITE.sameAs,
        address: { "@type": "PostalAddress", addressLocality: SITE.locality, addressCountry: SITE.countryCode },
        worksFor: { "@id": BUSINESS_ID },
      },
      {
        "@type": "ProfessionalService",
        "@id": BUSINESS_ID,
        name: `${SITE.name}, software development`,
        description: SITE.description,
        url: SITE.url,
        image: staticOgUrl("home"),
        founder: { "@id": PERSON_ID },
        address: { "@type": "PostalAddress", addressLocality: SITE.locality, addressCountry: SITE.countryCode },
        areaServed: [
          { "@type": "City", name: SITE.locality },
          { "@type": "Country", name: SITE.country },
          "Africa",
        ],
        sameAs: SITE.sameAs,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Software development services",
          itemListElement: SERVICES.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name, description: s.description, provider: { "@id": BUSINESS_ID } },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE.url,
        name: SITE.name,
        description: SITE.shortDescription,
        publisher: { "@id": PERSON_ID },
        inLanguage: "en",
      },
    ],
  }
}
