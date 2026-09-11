import type { Ad, Advertiser } from "../types";
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface ListItem {
  url: string;
  name: string;
  image?: string | null;
  description?: string | null;
}

interface WebPageOptions {
  url: string;
  name: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: ReturnType<typeof breadcrumbSchema>;
  speakableSelectors?: string[];
}

// ─── Core Site Schemas ───────────────────────────────────────────────────────

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    author: {
      "@type": "Organization",
      name: SITE_AUTHOR,
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function siteOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    sameAs: [
      "https://twitter.com/chatgptadslibrary",
    ],
  };
}

// ─── Page-Level Schemas ───────────────────────────────────────────────────────

export function webPageSchema(options: WebPageOptions) {
  const { url, name, description, datePublished, dateModified, breadcrumb, speakableSelectors } = options;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    ...(description ? { description } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(breadcrumb ? { breadcrumb } : {}),
    ...(speakableSelectors && speakableSelectors.length > 0
      ? {
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: speakableSelectors,
          },
        }
      : {}),
  };
}

export function collectionPageSchema(options: {
  url: string;
  name: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${options.url}#collectionpage`,
    url: options.url,
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

export function aboutPageSchema(options: { url: string; name: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${options.url}#aboutpage`,
    url: options.url,
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
}

export function profilePageSchema(advertiser: Advertiser) {
  const url = `${SITE_URL}/advertisers/${advertiser.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profilepage`,
    url,
    name: `${advertiser.name} — Advertiser Profile`,
    description: `${advertiser.name} has run ${advertiser.adCount} ad(s) on ChatGPT with ${advertiser.totalImpressions.toLocaleString()} total impressions.`,
    mainEntity: {
      "@type": "Organization",
      "@id": `${url}#organization`,
      name: advertiser.name,
      url: advertiser.websiteUrl ?? url,
      ...(advertiser.logo ? { logo: advertiser.logo } : {}),
      ...(advertiser.websiteUrl ? { sameAs: [advertiser.websiteUrl] } : {}),
    },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

// ─── Dataset ────────────────────────────────────────────────────────────────

export function datasetSchema(stats?: { totalAds: number; totalAdvertisers: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE_URL}/#dataset`,
    name: "ChatGPT Ads Library — Ad Archive",
    description:
      "A searchable archive of advertisements running across ChatGPT, including ad creative, advertiser details, impression counts, and publication dates.",
    url: SITE_URL,
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    ...(stats
      ? {
          size: `${stats.totalAds} ads from ${stats.totalAdvertisers} advertisers`,
        }
      : {}),
    keywords: [
      "ChatGPT ads",
      "AI advertising",
      "ad transparency",
      "OpenAI ads",
      "digital advertising",
    ],
  };
}

// ─── HowTo ──────────────────────────────────────────────────────────────────

export function howToSchema(options: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: options.name,
    description: options.description,
    step: options.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

// ─── Existing Schemas (preserved + enriched) ─────────────────────────────────

export function organizationSchema(advertiser: Advertiser) {
  const url = `${SITE_URL}/advertisers/${advertiser.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#organization`,
    name: advertiser.name,
    url: advertiser.websiteUrl ?? url,
    ...(advertiser.logo ? { logo: advertiser.logo } : {}),
    description: `${advertiser.name} has ${advertiser.adCount} ad(s) in the ChatGPT Ads Library.`,
    ...(advertiser.websiteUrl ? { sameAs: [advertiser.websiteUrl] } : {}),
    ...(advertiser.totalImpressions
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/WatchAction",
            userInteractionCount: advertiser.totalImpressions,
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function itemListSchema(items: ListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.image ? { image: item.image } : {}),
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export function creativeWorkSchema(ad: Ad) {
  const url = `${SITE_URL}/ads/${ad.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#creativework`,
    name: ad.copy,
    headline: ad.copy,
    description: ad.description ?? undefined,
    image: ad.mediaUrl ?? undefined,
    ...(ad.mediaUrl
      ? {
          thumbnailUrl: ad.mediaUrl,
          encoding: {
            "@type": "ImageObject",
            url: ad.mediaUrl,
            encodingFormat: "image/webp",
          },
        }
      : {}),
    datePublished: ad.publishedDate ?? undefined,
    url,
    mainEntityOfPage: url,
    publisher: {
      "@type": "Organization",
      name: ad.advertiserName,
      url: ad.websiteUrl ?? undefined,
      logo: ad.advertiserLogo ?? undefined,
    },
    about: {
      "@type": "Organization",
      name: ad.advertiserName,
      url: `${SITE_URL}/advertisers/${ad.advertiserSlug}`,
    },
    ...(ad.impressions
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/WatchAction",
            userInteractionCount: ad.impressions,
          },
        }
      : {}),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".ad-copy", ".ad-description"],
    },
    isPartOf: { "@id": `${SITE_URL}/#dataset` },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ─── @graph helper ────────────────────────────────────────────────────────────
/** Combines multiple schema objects under a single @graph for cleaner output */
export function graphSchema(...schemas: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas.map((s) => {
      // Strip individual @context when combining under @graph
      const { "@context": _ctx, ...rest } = s as Record<string, unknown>;
      return rest;
    }),
  };
}
