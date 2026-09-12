#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   Generate Ad ↔ Category Mappings
   Reads ads.json, advertisers.json, categories.json
   Outputs data/ad_categories.json
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ADS = JSON.parse(readFileSync(join(root, "data", "ads.json"), "utf8"));
const ADVERTISERS = JSON.parse(readFileSync(join(root, "data", "advertisers.json"), "utf8"));
const CATEGORIES = JSON.parse(readFileSync(join(root, "data", "categories.json"), "utf8"));

// Build advertiser lookup for enrichment
const advertiserMap = new Map();
for (const adv of ADVERTISERS) {
  advertiserMap.set(adv.slug, adv);
}

/**
 * Check if text matches any keyword in the list (case-insensitive).
 * Keywords can contain spaces and partial matches are intentional.
 */
function matchesKeywords(text, keywords) {
  if (!text) return false;
  const lower = ` ${text.toLowerCase()} `; // pad with spaces for word-boundary matching
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Categorize a single ad against all categories.
 * Returns an array of category slugs that match.
 */
function categorizeAd(ad) {
  const searchableText = [
    ad.advertiserName || ad.advertiser_name || "",
    ad.websiteDomain || ad.website_domain || "",
    ad.copy || "",
    ad.description || "",
  ].join(" ");

  const matched = [];
  for (const cat of CATEGORIES) {
    if (matchesKeywords(searchableText, cat.keywords)) {
      matched.push(cat.slug);
    }
  }
  return matched;
}

// Build the mapping
const result = {};
for (const cat of CATEGORIES) {
  result[cat.slug] = {
    adIds: [],
    advertiserSlugs: new Set(),
    adCount: 0,
    advertiserCount: 0,
  };
}

let totalMappings = 0;
let uncategorizedCount = 0;

for (const ad of ADS) {
  const categories = categorizeAd(ad);
  if (categories.length === 0) {
    uncategorizedCount++;
    continue;
  }

  const advSlug = ad.advertiserSlug || ad.advertiser_slug;

  for (const catSlug of categories) {
    result[catSlug].adIds.push(ad.id);
    if (advSlug) {
      result[catSlug].advertiserSlugs.add(advSlug);
    }
    totalMappings++;
  }
}

// Convert Sets to arrays and compute counts
const output = {};
for (const [slug, data] of Object.entries(result)) {
  const advSlugs = [...data.advertiserSlugs];
  output[slug] = {
    adIds: data.adIds,
    advertiserSlugs: advSlugs,
    adCount: data.adIds.length,
    advertiserCount: advSlugs.length,
  };
}

writeFileSync(
  join(root, "data", "ad_categories.json"),
  JSON.stringify(output, null, 2)
);

// Print summary
console.log("═══════════════════════════════════════════════════");
console.log("  Category Classification Report");
console.log("═══════════════════════════════════════════════════");
console.log(`  Total ads: ${ADS.length}`);
console.log(`  Total mappings: ${totalMappings}`);
console.log(`  Uncategorized ads: ${uncategorizedCount}`);
console.log("");

const sorted = Object.entries(output).sort((a, b) => b[1].adCount - a[1].adCount);
for (const [slug, data] of sorted) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const name = cat ? cat.name : slug;
  console.log(
    `  ${name.padEnd(20)} ${String(data.adCount).padStart(5)} ads | ${String(data.advertiserCount).padStart(5)} advertisers`
  );
}
console.log("═══════════════════════════════════════════════════");
console.log(`\nSaved to data/ad_categories.json`);
