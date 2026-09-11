import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SOURCE = join(root, "supaintent-2026-09-04.json");
const OUT_ADS = join(root, "data", "ads.json");
const OUT_ADVERTISERS = join(root, "data", "advertisers.json");

const MONTHS = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function parseDate(value) {
  if (!value) return null;
  const match = String(value).match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${MONTHS[month]}-${String(day).padStart(2, "0")}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function advertiserSlugFromHref(href) {
  if (!href) return null;
  const match = String(href).match(/\/advertisers\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]).toLowerCase() : null;
}

function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function stableId(record) {
  const key = [
    record.advertiserSlug,
    record.advertiserName,
    record.websiteUrl,
    record.copy,
    record.description,
    record.mediaUrl,
    record.publishedDate,
    record.impressions,
  ].join("|");
  return createHash("sha256").update(key).digest("hex").slice(0, 24);
}

const raw = JSON.parse(readFileSync(SOURCE, "utf8"));

const seen = new Map();
const ads = [];
let duplicates = 0;

for (const item of raw) {
  const advertiserName = (item["ad-card-advertiser"] || "").trim();
  const advertiserSlug =
    advertiserSlugFromHref(item["ad-card-advertiser href"]) ||
    slugify(advertiserName);

  const record = {
    id: "",
    advertiserSlug,
    advertiserName,
    advertiserLogo: item["ad-card-advertiser src"] || "",
    advertiserPageUrl: item["ad-card-advertiser href"] || "",
    websiteUrl: item["ad-card-website href"] || "",
    websiteDomain: (item["ad-card-website"] || "").trim(),
    copy: (item["ad-card-copy"] || "").trim(),
    description: (item["ad-card-description"] || "").trim(),
    mediaUrl: item["ad-card-media src"] || "",
    publishedDate: parseDate(item["ad-card-evidence (2)"]),
    impressions: toInt(item["ad-card-evidence (6)"]),
  };

  record.id = stableId(record);

  if (seen.has(record.id)) {
    duplicates += 1;
    record.id = `${record.id}-${seen.get(record.id) + 1}`;
  }

  seen.set(record.id, (seen.get(record.id) || 0) + 1);
  ads.push(record);
}

const advertiserMap = new Map();

for (const ad of ads) {
  let entry = advertiserMap.get(ad.advertiserSlug);
  if (!entry) {
    entry = {
      slug: ad.advertiserSlug,
      name: ad.advertiserName,
      logo: ad.advertiserLogo,
      websiteUrl: ad.websiteUrl,
      websiteDomain: ad.websiteDomain,
      adCount: 0,
      totalImpressions: 0,
      firstSeen: ad.publishedDate,
      lastSeen: ad.publishedDate,
      latestDate: ad.publishedDate,
    };
    advertiserMap.set(ad.advertiserSlug, entry);
  }

  entry.adCount += 1;
  entry.totalImpressions += ad.impressions;

  if (ad.publishedDate) {
    if (!entry.firstSeen || ad.publishedDate < entry.firstSeen) {
      entry.firstSeen = ad.publishedDate;
    }
    if (!entry.lastSeen || ad.publishedDate > entry.lastSeen) {
      entry.lastSeen = ad.publishedDate;
      entry.latestDate = ad.publishedDate;
      entry.logo = ad.advertiserLogo || entry.logo;
      entry.websiteUrl = ad.websiteUrl || entry.websiteUrl;
      entry.websiteDomain = ad.websiteDomain || entry.websiteDomain;
    }
  }
}

const advertisers = [...advertiserMap.values()].map(({ latestDate, ...rest }) => rest);

mkdirSync(dirname(OUT_ADS), { recursive: true });
writeFileSync(OUT_ADS, JSON.stringify(ads, null, 2));
writeFileSync(OUT_ADVERTISERS, JSON.stringify(advertisers, null, 2));

console.log(`ads: ${ads.length}`);
console.log(`advertisers: ${advertisers.length}`);
console.log(`duplicate id collisions resolved: ${duplicates}`);
console.log(`empty media urls: ${ads.filter((a) => !a.mediaUrl).length}`);
console.log(`empty descriptions: ${ads.filter((a) => !a.description).length}`);
