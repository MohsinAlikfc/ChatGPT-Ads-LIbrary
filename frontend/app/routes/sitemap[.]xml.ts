import type { LoaderFunctionArgs } from "react-router";
import { getSitemapData } from "../lib/db";
import { SITE_URL } from "../lib/site";

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod?: string | null, changefreq = "daily", priority = "0.8") {
  const lines = ["  <url>", `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) {
    const formatted = lastmod.length === 10 ? `${lastmod}T00:00:00Z` : lastmod;
    lines.push(`    <lastmod>${escapeXml(formatted)}</lastmod>`);
  }
  lines.push(`    <changefreq>${changefreq}</changefreq>`);
  lines.push(`    <priority>${priority}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;
  const { advertisers, ads } = await getSitemapData(db);

  const entries: string[] = [
    urlEntry(`${SITE_URL}/`, null, "daily", "1.0"),
    urlEntry(`${SITE_URL}/advertisers`, null, "daily", "0.9"),
    urlEntry(`${SITE_URL}/about`, null, "monthly", "0.6"),
  ];

  for (const advertiser of advertisers) {
    entries.push(
      urlEntry(
        `${SITE_URL}/advertisers/${advertiser.slug}`,
        advertiser.last_seen || advertiser.first_seen,
        "weekly",
        "0.8"
      )
    );
  }

  for (const ad of ads) {
    entries.push(
      urlEntry(`${SITE_URL}/ads/${ad.id}`, ad.published_date, "monthly", "0.6")
    );
  }

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  return new Response(sitemapXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
