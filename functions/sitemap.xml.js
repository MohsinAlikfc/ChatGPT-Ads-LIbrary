/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: Dynamic Sitemap XML
   Route: GET /sitemap.xml
   Rule: ONLY indexable pages (robots: index, follow) are included.
   - Root pages: /, /advertisers, /about
   - Pagination pages: /?page=2.., /advertisers?page=2..
   - All Advertiser profile pages: /advertisers/[slug]
   - Top-performing Ad page per advertiser ONLY: /ads/[id] (All others are noindex)
   ═══════════════════════════════════════════════════════════════════════════ */

function escapeXml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatIsoDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const lines = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];
  const iso = formatIsoDate(lastmod);
  if (iso) lines.push(`    <lastmod>${iso}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const siteUrl = 'https://chatgpt-ads-library.com';

  const limitPerPage = 24;

  let totalAdsCount = 0;
  let totalAdvCount = 0;
  let advertisers = [];
  let topAds = [];

  try {
    if (env.DB) {
      const [
        adsCountRes,
        advCountRes,
        advListRes,
        topAdsRes,
      ] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
        env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
        env.DB.prepare('SELECT slug, last_seen FROM advertisers ORDER BY total_impressions DESC').all(),
        env.DB.prepare(`
          WITH RankedAds AS (
            SELECT id, advertiser_slug, published_date,
                   ROW_NUMBER() OVER (
                     PARTITION BY advertiser_slug 
                     ORDER BY impressions DESC, published_date DESC, id ASC
                   ) as rank
            FROM ads
            WHERE advertiser_slug IS NOT NULL AND advertiser_slug != ''
          )
          SELECT id, published_date 
          FROM RankedAds 
          WHERE rank = 1
        `).all(),
      ]);

      totalAdsCount = adsCountRes?.count || 0;
      totalAdvCount = advCountRes?.count || 0;
      advertisers = advListRes?.results || [];
      topAds = topAdsRes?.results || [];
    }
  } catch (err) {
    console.error('D1 Query Error in sitemap.xml.js:', err);
  }

  const urls = [];

  // 1. Core Primary Pages
  urls.push(urlEntry(`${siteUrl}/`, null, 'daily', '1.0'));
  urls.push(urlEntry(`${siteUrl}/advertisers`, null, 'daily', '0.9'));
  urls.push(urlEntry(`${siteUrl}/about`, null, 'monthly', '0.7'));

  // 2. Indexable Homepage Pagination
  const totalHomePages = Math.ceil(totalAdsCount / limitPerPage);
  for (let p = 2; p <= Math.min(totalHomePages, 50); p++) {
    urls.push(urlEntry(`${siteUrl}/?page=${p}`, null, 'daily', '0.8'));
  }

  // 3. Indexable Advertisers Pagination
  const totalAdvPages = Math.ceil(totalAdvCount / limitPerPage);
  for (let p = 2; p <= Math.min(totalAdvPages, 50); p++) {
    urls.push(urlEntry(`${siteUrl}/advertisers?page=${p}`, null, 'daily', '0.7'));
  }

  // 4. All Advertiser Profiles (All have index, follow)
  for (const adv of advertisers) {
    if (adv.slug) {
      urls.push(
        urlEntry(
          `${siteUrl}/advertisers/${encodeURIComponent(adv.slug)}`,
          adv.last_seen || adv.lastSeen,
          'weekly',
          '0.8'
        )
      );
    }
  }

  // 5. Indexable Ad Pages ONLY (Best-performing single ad per advertiser)
  for (const ad of topAds) {
    if (ad.id) {
      urls.push(
        urlEntry(
          `${siteUrl}/ads/${encodeURIComponent(ad.id)}`,
          ad.published_date || ad.publishedDate,
          'monthly',
          '0.6'
        )
      );
    }
  }

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex', // Sitemap XML itself shouldn't be indexed as web content
    },
  });
}
