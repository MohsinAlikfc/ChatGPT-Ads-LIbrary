import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SITE_URL = (process.env.SITE_URL || "https://chatgpt-ads-library.com").replace(/\/+$/, "");
const PUBLIC_DIR = join(root, "frontend", "public");

const ADS = JSON.parse(readFileSync(join(root, "data", "ads.json"), "utf8"));
const ADVERTISERS = JSON.parse(readFileSync(join(root, "data", "advertisers.json"), "utf8"));

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const lines = ["  <url>", `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
}

const urls = [
  urlEntry(`${SITE_URL}/`, null, "daily", "1.0"),
  urlEntry(`${SITE_URL}/advertisers`, null, "daily", "0.9"),
  urlEntry(`${SITE_URL}/about`, null, "monthly", "0.6"),
];

for (const advertiser of ADVERTISERS) {
  urls.push(
    urlEntry(
      `${SITE_URL}/advertisers/${advertiser.slug}`,
      advertiser.lastSeen ?? null,
      "weekly",
      "0.8"
    )
  );
}

for (const ad of ADS) {
  urls.push(
    urlEntry(`${SITE_URL}/ads/${ad.id}`, ad.publishedDate ?? null, "monthly", "0.6")
  );
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  "</urlset>",
  "",
].join("\n");

mkdirSync(PUBLIC_DIR, { recursive: true });
writeFileSync(join(PUBLIC_DIR, "sitemap.xml"), sitemap);

console.log(`Wrote sitemap.xml (${urls.length} URLs)`);
console.log(`Site URL: ${SITE_URL}`);
