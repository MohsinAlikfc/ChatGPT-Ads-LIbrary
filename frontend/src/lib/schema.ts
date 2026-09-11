import type { Ad, Advertiser } from "../types";
import { SITE_NAME, SITE_URL } from "./site";

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

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: "Browse and search ads running across ChatGPT.",
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

export function organizationSchema(advertiser: Advertiser) {
  const url = `${SITE_URL}/advertisers/${advertiser.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#organization`,
    name: advertiser.name,
    url: advertiser.websiteUrl ?? url,
    logo: advertiser.logo ?? undefined,
    description: `${advertiser.name} has ${advertiser.adCount} ad(s) in the ChatGPT Ads Library.`,
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
  };
}

export function faqSchema(
  faqs: { question: string; answer: string }[]
) {
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
