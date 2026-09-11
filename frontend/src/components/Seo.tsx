import { useEffect } from "react";
import { SITE_AUTHOR, SITE_GEO_REGION, SITE_NAME, SITE_TWITTER_HANDLE, SITE_URL } from "../lib/site";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
  prev?: string;
  next?: string;
  jsonLd?: object[];
  /** Comma-separated keyword string for this page */
  keywords?: string;
  /** ISO date string — sets article:published_time for article pages */
  datePublished?: string;
  /** ISO date string — sets article:modified_time for article pages */
  dateModified?: string;
  /** Name of the article author (advertiser name for ad pages) */
  articleAuthor?: string;
}

const JSON_LD_ATTR = "data-seo-jsonld";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function removeMeta(attr: "name" | "property", key: string) {
  document.head.querySelectorAll(`meta[${attr}="${key}"]`).forEach((node) => node.remove());
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  // For prev/next we want a unique element per rel; for canonical just one.
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
  if (extra) {
    for (const [attr, value] of Object.entries(extra)) {
      element.setAttribute(attr, value);
    }
  }
}

function removeLink(rel: string) {
  document.head.querySelectorAll(`link[rel="${rel}"]`).forEach((node) => node.remove());
}

function removeManagedJsonLd() {
  document.head
    .querySelectorAll(`script[${JSON_LD_ATTR}]`)
    .forEach((node) => node.remove());
}

function addJsonLd(objects: object[]) {
  for (const object of objects) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(JSON_LD_ATTR, "true");
    script.textContent = JSON.stringify(object, null, 0);
    document.head.appendChild(script);
  }
}

export default function Seo({
  title,
  description,
  path,
  type = "website",
  image,
  noindex = false,
  prev,
  next,
  jsonLd = [],
  keywords,
  datePublished,
  dateModified,
  articleAuthor,
}: SeoProps) {
  useEffect(() => {
    const canonical = `${SITE_URL}${path}`;
    const robots = noindex ? "noindex, follow" : "index, follow";

    // ── Core ──────────────────────────────────────────────────────────────────
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    if (keywords) upsertMeta("name", "keywords", keywords);
    else removeMeta("name", "keywords");
    upsertMeta("name", "author", SITE_AUTHOR);

    // ── Geo ───────────────────────────────────────────────────────────────────
    upsertMeta("name", "geo.region", SITE_GEO_REGION);
    upsertMeta("name", "geo.placename", "United States");

    // ── Open Graph ────────────────────────────────────────────────────────────
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:locale", "en_US");

    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("property", "og:image:alt", title);
    } else {
      removeMeta("property", "og:image");
      removeMeta("property", "og:image:alt");
    }

    // ── Article-specific OG ───────────────────────────────────────────────────
    if (type === "article") {
      if (datePublished) upsertMeta("property", "article:published_time", datePublished);
      else removeMeta("property", "article:published_time");

      if (dateModified) upsertMeta("property", "article:modified_time", dateModified);
      else removeMeta("property", "article:modified_time");

      if (articleAuthor) upsertMeta("property", "article:author", articleAuthor);
      else removeMeta("property", "article:author");
    } else {
      removeMeta("property", "article:published_time");
      removeMeta("property", "article:modified_time");
      removeMeta("property", "article:author");
    }

    // ── Twitter / X ──────────────────────────────────────────────────────────
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:site", SITE_TWITTER_HANDLE);
    upsertMeta("name", "twitter:creator", SITE_TWITTER_HANDLE);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (image) upsertMeta("name", "twitter:image", image);
    else removeMeta("name", "twitter:image");

    // ── Canonical + Pagination links ──────────────────────────────────────────
    upsertLink("canonical", canonical);
    if (prev) upsertLink("prev", `${SITE_URL}${prev}`);
    else removeLink("prev");
    if (next) upsertLink("next", `${SITE_URL}${next}`);
    else removeLink("next");

    // ── JSON-LD ───────────────────────────────────────────────────────────────
    removeManagedJsonLd();
    addJsonLd(jsonLd);

    return () => {
      removeManagedJsonLd();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, type, image, noindex, prev, next, keywords, datePublished, dateModified, articleAuthor, JSON.stringify(jsonLd)]);

  return null;
}
