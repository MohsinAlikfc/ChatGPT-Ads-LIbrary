/* ═══════════════════════════════════════════════════════════════════════════
   ChatGPT Ads Library — Cloudflare Worker API
   Queries D1 (SQLite at the edge) and returns JSON.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Helpers ──────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
      ...extraHeaders,
    },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

// ── SQL constants ────────────────────────────────────────────────────────

const AD_SELECT = `
  SELECT id, advertiser_slug, advertiser_name, advertiser_logo,
         advertiser_page_url, website_url, website_domain, copy,
         description, media_url, published_date, impressions
  FROM ads
`;

const AD_SORTS = {
  date_desc: 'published_date DESC, impressions DESC',
  date_asc: 'published_date ASC, impressions DESC',
  impressions_desc: 'impressions DESC, published_date DESC',
  impressions_asc: 'impressions ASC, published_date DESC',
};

const ADVERTISER_SORTS = {
  name_asc: 'name ASC',
  name_desc: 'name DESC',
  ad_count_desc: 'ad_count DESC, name ASC',
  impressions_desc: 'total_impressions DESC, name ASC',
};

// ── Row mappers ──────────────────────────────────────────────────────────

function mapAd(row) {
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

function mapAdvertiser(row) {
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

// ── Query builders ───────────────────────────────────────────────────────

function buildAdWhere(params) {
  const conditions = [];
  const values = [];

  if (params.q) {
    const like = `%${escapeLike(params.q)}%`;
    conditions.push(
      "(advertiser_name LIKE ? ESCAPE '\\' OR website_domain LIKE ? ESCAPE '\\' OR copy LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')"
    );
    values.push(like, like, like, like);
  }

  if (params.advertiser) {
    conditions.push('advertiser_slug = ?');
    values.push(params.advertiser);
  }

  if (params.minImpressions != null) {
    conditions.push('impressions >= ?');
    values.push(params.minImpressions);
  }

  if (params.maxImpressions != null) {
    conditions.push('impressions <= ?');
    values.push(params.maxImpressions);
  }

  if (params.dateFrom) {
    conditions.push('published_date >= ?');
    values.push(params.dateFrom);
  }

  if (params.dateTo) {
    conditions.push('published_date <= ?');
    values.push(params.dateTo);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

// ── Route handlers ───────────────────────────────────────────────────────

async function handleListAds(db, url) {
  const q = url.searchParams.get('q') || undefined;
  const advertiser = url.searchParams.get('advertiser') || undefined;
  const sort = url.searchParams.get('sort') || 'date_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 24));
  const minImpressions = url.searchParams.get('min_impressions')
    ? Number(url.searchParams.get('min_impressions'))
    : undefined;
  const maxImpressions = url.searchParams.get('max_impressions')
    ? Number(url.searchParams.get('max_impressions'))
    : undefined;
  const dateFrom = url.searchParams.get('date_from') || undefined;
  const dateTo = url.searchParams.get('date_to') || undefined;

  const offset = (page - 1) * limit;
  const orderBy = AD_SORTS[sort] || AD_SORTS.date_desc;
  const { where, values } = buildAdWhere({
    q, advertiser, minImpressions, maxImpressions, dateFrom, dateTo,
  });

  const countResult = await db
    .prepare(`SELECT COUNT(*) AS total FROM ads ${where}`)
    .bind(...values)
    .first();
  const total = countResult?.total ?? 0;

  const result = await db
    .prepare(`${AD_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .bind(...values, limit, offset)
    .all();

  return jsonResponse({
    ads: result.results.map(mapAd),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function handleGetAd(db, id) {
  const row = await db
    .prepare(`${AD_SELECT} WHERE id = ?`)
    .bind(id)
    .first();

  if (!row) return errorResponse('Ad not found', 404);

  // Fetch related ads from same advertiser
  const relatedResult = await db
    .prepare(`${AD_SELECT} WHERE advertiser_slug = ? ORDER BY impressions DESC LIMIT 5`)
    .bind(row.advertiser_slug)
    .all();

  const relatedAds = relatedResult.results
    .filter((r) => r.id !== row.id)
    .slice(0, 4)
    .map(mapAd);

  return jsonResponse({ ad: mapAd(row), relatedAds });
}

async function handleListAdvertisers(db, url) {
  const q = url.searchParams.get('q') || undefined;
  const sort = url.searchParams.get('sort') || 'ad_count_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(5000, Math.max(1, Number(url.searchParams.get('limit')) || 60));
  const offset = (page - 1) * limit;
  const orderBy = ADVERTISER_SORTS[sort] || ADVERTISER_SORTS.ad_count_desc;

  const conditions = [];
  const values = [];

  if (q) {
    const like = `%${escapeLike(q)}%`;
    conditions.push("(name LIKE ? ESCAPE '\\' OR website_domain LIKE ? ESCAPE '\\')");
    values.push(like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db
    .prepare(`SELECT COUNT(*) AS total FROM advertisers ${where}`)
    .bind(...values)
    .first();
  const total = countResult?.total ?? 0;

  const result = await db
    .prepare(
      `SELECT slug, name, logo, website_url, website_domain, ad_count, total_impressions, first_seen, last_seen
       FROM advertisers ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    )
    .bind(...values, limit, offset)
    .all();

  return jsonResponse({
    advertisers: result.results.map(mapAdvertiser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function handleGetAdvertiser(db, slug, url) {
  const row = await db
    .prepare(
      `SELECT slug, name, logo, website_url, website_domain, ad_count, total_impressions, first_seen, last_seen
       FROM advertisers WHERE slug = ?`
    )
    .bind(slug)
    .first();

  if (!row) return errorResponse('Advertiser not found', 404);

  const sort = url.searchParams.get('sort') || 'date_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 24));
  const offset = (page - 1) * limit;
  const orderBy = AD_SORTS[sort] || AD_SORTS.date_desc;

  const countResult = await db
    .prepare('SELECT COUNT(*) AS total FROM ads WHERE advertiser_slug = ?')
    .bind(slug)
    .first();
  const total = countResult?.total ?? 0;

  const adsResult = await db
    .prepare(`${AD_SELECT} WHERE advertiser_slug = ? ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .bind(slug, limit, offset)
    .all();

  return jsonResponse({
    advertiser: mapAdvertiser(row),
    ads: adsResult.results.map(mapAd),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function handleStats(db) {
  const totals = await db
    .prepare(
      'SELECT (SELECT COUNT(*) FROM ads) AS total_ads, (SELECT COUNT(*) FROM advertisers) AS total_advertisers'
    )
    .first();

  const range = await db
    .prepare('SELECT MIN(published_date) AS min_date, MAX(published_date) AS max_date FROM ads')
    .first();

  const topAdvertisers = await db
    .prepare(
      `SELECT slug, name, logo, website_domain, ad_count, total_impressions
       FROM advertisers ORDER BY total_impressions DESC LIMIT 10`
    )
    .all();

  return jsonResponse({
    totalAds: totals?.total_ads ?? 0,
    totalAdvertisers: totals?.total_advertisers ?? 0,
    minDate: range?.min_date ?? null,
    maxDate: range?.max_date ?? null,
    topAdvertisers: topAdvertisers?.results
      ? topAdvertisers.results.map((r) => ({
          slug: r.slug,
          name: r.name,
          logo: r.logo,
          websiteDomain: r.website_domain,
          adCount: r.ad_count,
          totalImpressions: r.total_impressions,
        }))
      : [],
  });
}

async function handleSitemapData(db) {
  const [advertisers, ads] = await Promise.all([
    db
      .prepare('SELECT slug, last_seen, first_seen FROM advertisers ORDER BY total_impressions DESC')
      .all(),
    db
      .prepare('SELECT id, published_date FROM ads ORDER BY published_date DESC')
      .all(),
  ]);

  return jsonResponse({
    advertisers: advertisers?.results ?? [],
    ads: ads?.results ?? [],
  });
}

// ── Router ───────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const db = env.DB;

    try {
      // Normalize path (strip optional /api prefix)
      const apiPath = path.startsWith('/api/') ? path.slice(4) : (path === '/api' ? '/' : path);

      // /stats
      if (apiPath === '/stats') {
        return handleStats(db);
      }

      // /sitemap-data
      if (apiPath === '/sitemap-data') {
        return handleSitemapData(db);
      }

      // /ads (list)
      if (apiPath === '/ads') {
        return handleListAds(db, url);
      }

      // /ads/:id (detail)
      const adMatch = apiPath.match(/^\/ads\/([^/]+)$/);
      if (adMatch) {
        return handleGetAd(db, decodeURIComponent(adMatch[1]));
      }

      // /advertisers (list)
      if (apiPath === '/advertisers') {
        return handleListAdvertisers(db, url);
      }

      // /advertisers/:slug (detail)
      const advMatch = apiPath.match(/^\/advertisers\/([^/]+)$/);
      if (advMatch) {
        return handleGetAdvertiser(db, decodeURIComponent(advMatch[1]), url);
      }

      // /health
      if (apiPath === '/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      return errorResponse('Not found', 404);
    } catch (err) {
      console.error('Worker error:', err);
      return errorResponse('Internal server error', 500);
    }
  },
};
