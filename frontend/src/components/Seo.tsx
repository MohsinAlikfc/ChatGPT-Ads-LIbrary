import { useEffect } from "react";
import { SITE_NAME, SITE_URL } from "../lib/site";

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

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
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
    script.textContent = JSON.stringify(object);
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
}: SeoProps) {
  useEffect(() => {
    const canonical = `${SITE_URL}${path}`;
    const robots = noindex ? "noindex, follow" : "index, follow";

    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }

    upsertLink("canonical", canonical);
    if (prev) upsertLink("prev", `${SITE_URL}${prev}`);
    else removeLink("prev");
    if (next) upsertLink("next", `${SITE_URL}${next}`);
    else removeLink("next");

    removeManagedJsonLd();
    addJsonLd(jsonLd);

    return () => {
      removeManagedJsonLd();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, type, image, noindex, prev, next, JSON.stringify(jsonLd)]);

  return null;
}
