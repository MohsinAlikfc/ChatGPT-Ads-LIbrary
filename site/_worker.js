/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages _worker.js Handler
   - Rewrites /ads/:id to ad.html with 200 OK
   - Rewrites /advertisers/:slug to advertiser.html with 200 OK
   - Rewrites clean directory paths (/advertisers, /about) to static HTML
   - Serves /api/* directly from D1 if DB is bound
   - Passes all static assets through to env.ASSETS
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
    q,
    advertiser,
    minImpressions,
    maxImpressions,
    dateFrom,
    dateTo,
  });

  const countQuery = `SELECT COUNT(*) as count FROM ads ${where}`;
  const totalResult = await db.prepare(countQuery).bind(...values).first();
  const total = totalResult?.count || 0;

  const dataQuery = `${AD_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const { results } = await db.prepare(dataQuery).bind(...values, limit, offset).all();

  return jsonResponse({
    ads: (results || []).map(mapAd),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

async function handleGetAd(db, id) {
  const query = `${AD_SELECT} WHERE id = ?`;
  const ad = await db.prepare(query).bind(id).first();

  if (!ad) {
    return errorResponse('Ad not found', 404);
  }

  const relatedQuery = `${AD_SELECT} WHERE advertiser_slug = ? AND id != ? ORDER BY impressions DESC LIMIT 4`;
  const { results: related } = await db
    .prepare(relatedQuery)
    .bind(ad.advertiser_slug, id)
    .all();

  return jsonResponse({
    ad: mapAd(ad),
    relatedAds: (related || []).map(mapAd),
  });
}

async function handleListAdvertisers(db, url) {
  const q = url.searchParams.get('q') || undefined;
  const sort = url.searchParams.get('sort') || 'ad_count_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 24));

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

  const countResult = await db.prepare(`SELECT COUNT(*) as count FROM advertisers ${where}`).bind(...values).first();
  const total = countResult?.count || 0;

  const { results } = await db
    .prepare(`SELECT * FROM advertisers ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .bind(...values, limit, offset)
    .all();

  return jsonResponse({
    advertisers: (results || []).map(mapAdvertiser),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

async function handleGetAdvertiser(db, slug, url) {
  const adv = await db.prepare('SELECT * FROM advertisers WHERE slug = ?').bind(slug).first();

  if (!adv) {
    return errorResponse('Advertiser not found', 404);
  }

  const sort = url.searchParams.get('sort') || 'date_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 24));
  const offset = (page - 1) * limit;
  const orderBy = AD_SORTS[sort] || AD_SORTS.date_desc;

  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM ads WHERE advertiser_slug = ?')
    .bind(slug)
    .first();
  const totalAds = countResult?.count || 0;

  const { results } = await db
    .prepare(`${AD_SELECT} WHERE advertiser_slug = ? ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .bind(slug, limit, offset)
    .all();

  return jsonResponse({
    advertiser: mapAdvertiser(adv),
    ads: (results || []).map(mapAd),
    totalAds,
    page,
    limit,
    totalPages: Math.ceil(totalAds / limit),
  });
}

async function handleStats(db) {
  const [adsCount, advCount, impressionsResult, dateResult, topAdv] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM ads').first(),
    db.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
    db.prepare('SELECT SUM(impressions) as total FROM ads').first(),
    db.prepare('SELECT MIN(published_date) as minDate, MAX(published_date) as maxDate FROM ads').first(),
    db.prepare('SELECT * FROM advertisers ORDER BY total_impressions DESC LIMIT 10').all(),
  ]);

  return jsonResponse({
    totalAds: adsCount?.count || 0,
    totalAdvertisers: advCount?.count || 0,
    totalImpressions: impressionsResult?.total || 0,
    minDate: dateResult?.minDate || null,
    maxDate: dateResult?.maxDate || null,
    topAdvertisers: (topAdv?.results || []).map(mapAdvertiser),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

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

    // ── API Route Handling (if D1 binding is present) ─────────────────────
    if (env.DB && (path.startsWith('/api/') || path === '/stats' || path === '/ads' || path === '/advertisers')) {
      const apiPath = path.startsWith('/api/') ? path.slice(4) : path;

      try {
        if (apiPath === '/stats') return handleStats(env.DB);
        if (apiPath === '/ads') return handleListAds(env.DB, url);
        
        const adMatch = apiPath.match(/^\/ads\/([^/]+)$/);
        if (adMatch) return handleGetAd(env.DB, decodeURIComponent(adMatch[1]));

        if (apiPath === '/advertisers') return handleListAdvertisers(env.DB, url);

        const advMatch = apiPath.match(/^\/advertisers\/([^/]+)$/);
        if (advMatch) return handleGetAdvertiser(env.DB, decodeURIComponent(advMatch[1]), url);

        if (apiPath === '/health') return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      } catch (err) {
        console.error('API Error:', err);
        return errorResponse('Internal API Error', 500);
      }
    }

    // ── URL Rewriting for Clean Static Routes ─────────────────────────────
    if (path.startsWith('/ads/') && path.length > 5) {
      // Rewrite /ads/:id to /ad
      const rewriteUrl = new URL('/ad', request.url);
      return env.ASSETS.fetch(new Request(rewriteUrl.toString(), request));
    }

    if (path.startsWith('/advertisers/') && path.length > 13) {
      // Rewrite /advertisers/:slug to /advertiser
      const rewriteUrl = new URL('/advertiser', request.url);
      return env.ASSETS.fetch(new Request(rewriteUrl.toString(), request));
    }

    if (path.startsWith('/advertiser/') && path.length > 12) {
      // Rewrite /advertiser/:slug to /advertiser
      const rewriteUrl = new URL('/advertiser', request.url);
      return env.ASSETS.fetch(new Request(rewriteUrl.toString(), request));
    }

    // Default: Serve static asset via Cloudflare Pages Asset fetcher
    return env.ASSETS.fetch(request);
  },
};
