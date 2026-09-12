import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SITE_URL = (process.env.SITE_URL || "https://chatgpt-ads-library.com").replace(/\/+$/, "");
const PUBLIC_DIR = join(root, "public");
const FRONTEND_PUBLIC_DIR = join(root, "frontend", "public");

const ADS = JSON.parse(readFileSync(join(root, "data", "ads.json"), "utf8"));
const ADVERTISERS = JSON.parse(readFileSync(join(root, "data", "advertisers.json"), "utf8"));

function escapeXml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatIsoDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const lines = ["  <url>", `    <loc>${escapeXml(loc)}</loc>`];
  const iso = formatIsoDate(lastmod);
  if (iso) lines.push(`    <lastmod>${iso}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
}

const urls = [];

// 1. Core Primary Pages
urls.push(urlEntry(`${SITE_URL}/`, null, "daily", "1.0"));
urls.push(urlEntry(`${SITE_URL}/advertisers`, null, "daily", "0.9"));
urls.push(urlEntry(`${SITE_URL}/about`, null, "monthly", "0.7"));

// 2. Indexable Homepage Pagination
const totalHomePages = Math.ceil(ADS.length / 24);
for (let p = 2; p <= Math.min(totalHomePages, 50); p++) {
  urls.push(urlEntry(`${SITE_URL}/?page=${p}`, null, "daily", "0.8"));
}

// 3. Indexable Advertisers Pagination
const totalAdvPages = Math.ceil(ADVERTISERS.length / 24);
for (let p = 2; p <= Math.min(totalAdvPages, 50); p++) {
  urls.push(urlEntry(`${SITE_URL}/advertisers?page=${p}`, null, "daily", "0.7"));
}

// 4. All Advertiser Profiles (All have index, follow)
for (const advertiser of ADVERTISERS) {
  if (advertiser.slug) {
    urls.push(
      urlEntry(
        `${SITE_URL}/advertisers/${encodeURIComponent(advertiser.slug)}`,
        advertiser.lastSeen ?? advertiser.last_seen ?? null,
        "weekly",
        "0.8"
      )
    );
  }
}

// 5. Indexable Ad Pages ONLY (Best-performing single ad per advertiser)
// Group ads by advertiser
const adsByAdv = new Map();
for (const ad of ADS) {
  const slug = ad.advertiserSlug || ad.advertiser_slug;
  if (!slug) continue;
  if (!adsByAdv.has(slug)) {
    adsByAdv.set(slug, []);
  }
  adsByAdv.get(slug).push(ad);
}

// Pick the single top ad for each advertiser
let topAdCount = 0;
for (const [slug, list] of adsByAdv.entries()) {
  list.sort((a, b) => {
    const impA = Number(a.impressions) || 0;
    const impB = Number(b.impressions) || 0;
    if (impB !== impA) return impB - impA;
    const dateA = new Date(a.publishedDate || a.published_date || 0).getTime();
    const dateB = new Date(b.publishedDate || b.published_date || 0).getTime();
    return dateB - dateA;
  });

  const topAd = list[0];
  if (topAd && topAd.id) {
    topAdCount++;
    urls.push(
      urlEntry(
        `${SITE_URL}/ads/${encodeURIComponent(topAd.id)}`,
        topAd.publishedDate || topAd.published_date || null,
        "monthly",
        "0.6"
      )
    );
  }
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

try {
  mkdirSync(FRONTEND_PUBLIC_DIR, { recursive: true });
  writeFileSync(join(FRONTEND_PUBLIC_DIR, "sitemap.xml"), sitemap);
} catch {}

console.log(`Successfully generated sitemap.xml with ${urls.length} URLs (including ${topAdCount} top indexed ads)`);
console.log(`Saved to ${join(PUBLIC_DIR, "sitemap.xml")}`);
