import type { Ad, Advertiser, ListAdsParams, ListAdvertisersParams } from "./types";

interface AdRow {
  id: string;
  advertiser_slug: string;
  advertiser_name: string;
  advertiser_logo: string | null;
  advertiser_page_url: string | null;
  website_url: string | null;
  website_domain: string | null;
  copy: string;
  description: string | null;
  media_url: string | null;
  published_date: string | null;
  impressions: number;
}

interface AdvertiserRow {
  slug: string;
  name: string;
  logo: string | null;
  website_url: string | null;
  website_domain: string | null;
  ad_count: number;
  total_impressions: number;
  first_seen: string | null;
  last_seen: string | null;
}

interface CountRow {
  total: number;
}

const AD_SELECT = `
  SELECT id, advertiser_slug, advertiser_name, advertiser_logo,
         advertiser_page_url, website_url, website_domain, copy,
         description, media_url, published_date, impressions
  FROM ads
`;

const AD_SORTS: Record<string, string> = {
  date_desc: "published_date DESC, impressions DESC",
  date_asc: "published_date ASC, impressions DESC",
  impressions_desc: "impressions DESC, published_date DESC",
  impressions_asc: "impressions ASC, published_date DESC",
};

const ADVERTISER_SORTS: Record<string, string> = {
  name_asc: "name ASC",
  name_desc: "name DESC",
  ad_count_desc: "ad_count DESC, name ASC",
  impressions_desc: "total_impressions DESC, name ASC",
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function mapAd(row: AdRow): Ad {
  return {
    id: row.id,
    advertiserSlug: row.advertiser_slug,
    advertiserName: row.advertiser_name,
    advertiserLogo: row.advertiser_logo,
    advertiserPageUrl: row.advertiser_page_url,
    websiteUrl: row.website_url,
    websiteDomain: row.website_domain,
    copy: row.copy,
    description: row.description,
    mediaUrl: row.media_url,
    publishedDate: row.published_date,
    impressions: row.impressions,
  };
}

function mapAdvertiser(row: AdvertiserRow): Advertiser {
  return {
    slug: row.slug,
    name: row.name,
    logo: row.logo,
    websiteUrl: row.website_url,
    websiteDomain: row.website_domain,
    adCount: row.ad_count,
    totalImpressions: row.total_impressions,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
  };
}

function buildAdWhere(params: ListAdsParams) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.q) {
    const like = `%${escapeLike(params.q)}%`;
    conditions.push(
      "(advertiser_name LIKE ? ESCAPE '\\' OR website_domain LIKE ? ESCAPE '\\' OR copy LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')"
    );
    values.push(like, like, like, like);
  }

  if (params.advertiser) {
    conditions.push("advertiser_slug = ?");
    values.push(params.advertiser);
  }

  if (params.minImpressions != null) {
    conditions.push("impressions >= ?");
    values.push(params.minImpressions);
  }

  if (params.maxImpressions != null) {
    conditions.push("impressions <= ?");
    values.push(params.maxImpressions);
  }

  if (params.dateFrom) {
    conditions.push("published_date >= ?");
    values.push(params.dateFrom);
  }

  if (params.dateTo) {
    conditions.push("published_date <= ?");
    values.push(params.dateTo);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", values };
}

export async function listAds(
  db: D1Database,
  params: ListAdsParams
): Promise<{ ads: Ad[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 24));
  const offset = (page - 1) * limit;
  const sort = AD_SORTS[params.sort ?? "date_desc"] ?? AD_SORTS.date_desc;
  const { where, values } = buildAdWhere(params);

  const countResult = await db
    .prepare(`SELECT COUNT(*) AS total FROM ads ${where}`)
    .bind(...values)
    .first<CountRow>();

  const total = countResult?.total ?? 0;

  const result = await db
    .prepare(`${AD_SELECT} ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`)
    .bind(...values, limit, offset)
    .all<AdRow>();

  return { ads: result.results.map(mapAd), total, page, limit };
}

export async function getAd(db: D1Database, id: string): Promise<Ad | null> {
  const row = await db.prepare(`${AD_SELECT} WHERE id = ?`).bind(id).first<AdRow>();
  return row ? mapAd(row) : null;
}

export async function listAdvertisers(
  db: D1Database,
  params: ListAdvertisersParams
): Promise<{ advertisers: Advertiser[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(5000, Math.max(1, params.limit ?? 60));
  const offset = (page - 1) * limit;
  const sort = ADVERTISER_SORTS[params.sort ?? "ad_count_desc"] ?? ADVERTISER_SORTS.ad_count_desc;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.q) {
    const like = `%${escapeLike(params.q)}%`;
    conditions.push("(name LIKE ? ESCAPE '\\' OR website_domain LIKE ? ESCAPE '\\')");
    values.push(like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await db
    .prepare(`SELECT COUNT(*) AS total FROM advertisers ${where}`)
    .bind(...values)
    .first<CountRow>();

  const total = countResult?.total ?? 0;

  const result = await db
    .prepare(
      `SELECT slug, name, logo, website_url, website_domain, ad_count, total_impressions, first_seen, last_seen
       FROM advertisers ${where} ORDER BY ${sort} LIMIT ? OFFSET ?`
    )
    .bind(...values, limit, offset)
    .all<AdvertiserRow>();

  return { advertisers: result.results.map(mapAdvertiser), total, page, limit };
}

export async function getAdvertiser(db: D1Database, slug: string): Promise<Advertiser | null> {
  const row = await db
    .prepare(
      `SELECT slug, name, logo, website_url, website_domain, ad_count, total_impressions, first_seen, last_seen
       FROM advertisers WHERE slug = ?`
    )
    .bind(slug)
    .first<AdvertiserRow>();

  return row ? mapAdvertiser(row) : null;
}

export async function listAdsByAdvertiser(
  db: D1Database,
  slug: string,
  params: ListAdsParams
): Promise<{ ads: Ad[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 24));
  const offset = (page - 1) * limit;
  const sort = AD_SORTS[params.sort ?? "date_desc"] ?? AD_SORTS.date_desc;

  const countResult = await db
    .prepare("SELECT COUNT(*) AS total FROM ads WHERE advertiser_slug = ?")
    .bind(slug)
    .first<CountRow>();

  const total = countResult?.total ?? 0;

  const result = await db
    .prepare(`${AD_SELECT} WHERE advertiser_slug = ? ORDER BY ${sort} LIMIT ? OFFSET ?`)
    .bind(slug, limit, offset)
    .all<AdRow>();

  return { ads: result.results.map(mapAd), total, page, limit };
}

export async function getStats(db: D1Database) {
  const totals = await db
    .prepare(
      "SELECT (SELECT COUNT(*) FROM ads) AS total_ads, (SELECT COUNT(*) FROM advertisers) AS total_advertisers"
    )
    .first<{ total_ads: number; total_advertisers: number }>();

  const range = await db
    .prepare("SELECT MIN(published_date) AS min_date, MAX(published_date) AS max_date FROM ads")
    .first<{ min_date: string | null; max_date: string | null }>();

  const topAdvertisers = await db
    .prepare(
      `SELECT slug, name, logo, website_domain, ad_count, total_impressions
       FROM advertisers ORDER BY total_impressions DESC LIMIT 10`
    )
    .all<AdvertiserRow>();

  return {
    totalAds: totals?.total_ads ?? 0,
    totalAdvertisers: totals?.total_advertisers ?? 0,
    minDate: range?.min_date ?? null,
    maxDate: range?.max_date ?? null,
    topAdvertisers: topAdvertisers.results.map(mapAdvertiser),
  };
}
