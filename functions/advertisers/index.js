/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: Advertisers Directory SSR
   Route: GET /advertisers
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  escapeHtml,
  formatDate,
  formatNumber,
  renderAdvertiserAvatar,
  renderPagination,
  renderPageLayout,
} from '../_template.js';

function escapeLike(val) {
  return String(val).replace(/[\\%_]/g, '\\$&');
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const q = url.searchParams.get('q')?.trim() || '';
  const sort = url.searchParams.get('sort') || 'ad_count_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];

  if (q) {
    const like = `%${escapeLike(q)}%`;
    conditions.push("(name LIKE ? ESCAPE '\\' OR website_domain LIKE ? ESCAPE '\\')");
    values.push(like, like);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap = {
    ad_count_desc: 'ad_count DESC, name ASC',
    impressions_desc: 'total_impressions DESC, name ASC',
    name_asc: 'name ASC',
    name_desc: 'name DESC',
  };
  const orderBy = sortMap[sort] || sortMap.ad_count_desc;

  let advertisers = [];
  let totalAdvertisers = 0;
  let stats = { totalAds: 0, totalAdvertisers: 0, totalImpressions: 0 };

  try {
    const [advResult, countResult, statsAds, statsAdv, statsImp] = await Promise.all([
      env.DB.prepare(`
        SELECT slug, name, logo, website_url, website_domain,
               ad_count, total_impressions, first_seen, last_seen
        FROM advertisers
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `).bind(...values, limit, offset).all(),

      env.DB.prepare(`SELECT COUNT(*) as count FROM advertisers ${whereClause}`).bind(...values).first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
    ]);

    advertisers = advResult?.results || [];
    totalAdvertisers = countResult?.count || 0;
    stats = {
      totalAds: statsAds?.count || 0,
      totalAdvertisers: statsAdv?.count || totalAdvertisers,
      totalImpressions: statsImp?.total || 0,
    };
  } catch (err) {
    console.error('D1 Query Error in advertisers/index.js:', err);
  }

  const totalPages = Math.ceil(totalAdvertisers / limit) || 1;
  const isFiltered = Boolean(q || (sort && sort !== 'ad_count_desc'));

  const pageTitle = q
    ? `Search results for "${q}" — Advertisers Directory`
    : page > 1
      ? `Advertisers Directory — ChatGPT Ads Library (Page ${page})`
      : 'Advertisers Directory — ChatGPT Ads Library';

  let canonicalUrl = `${url.origin}/advertisers`;
  let robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  if (isFiltered) {
    canonicalUrl = `${url.origin}/advertisers`;
    robots = 'noindex, follow';
  } else if (page > 1) {
    const canonicalUrlObj = new URL(`${url.origin}/advertisers`);
    canonicalUrlObj.searchParams.set('page', page);
    canonicalUrl = canonicalUrlObj.toString();
  }

  const getPageUrl = (p) => {
    const pUrl = new URL(`${url.origin}/advertisers`);
    if (q) pUrl.searchParams.set('q', q);
    if (sort && sort !== 'ad_count_desc') pUrl.searchParams.set('sort', sort);
    if (p > 1) pUrl.searchParams.set('page', p);
    return pUrl.toString();
  };

  const prevPageUrl = page > 1 ? getPageUrl(page - 1) : null;
  const nextPageUrl = page < totalPages ? getPageUrl(page + 1) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ChatGPT Ads Library Advertisers Directory',
    description: pageDescription,
    numberOfItems: advertisers.length,
    itemListElement: advertisers.map((adv, idx) => ({
      '@type': 'ListItem',
      position: offset + idx + 1,
      item: {
        '@type': 'Organization',
        name: adv.name,
        url: `${url.origin}/advertisers/${adv.slug}`,
        image: adv.logo || undefined,
      },
    })),
  };

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center">
        <h1 class="page-title animate-fade-in">Advertisers Directory</h1>
        <p class="page-subtitle animate-fade-in">
          Explore all brands, organizations, and sponsors indexed in the ChatGPT Ads Library transparency archive.
        </p>
      </div>
    </section>

    <section class="browse-section">
      <div class="container">
        <form method="GET" action="/advertisers" class="search-filter-bar" role="search">
          <div class="search-box-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24"><use href="#icon-search"></use></svg>
            <input
              type="search"
              name="q"
              value="${escapeHtml(q)}"
              class="search-input"
              placeholder="Search advertisers by name or domain..."
              autocomplete="off"
            />
          </div>

          <div class="filter-controls-group">
            <select name="sort" class="form-select filter-select" aria-label="Sort advertisers">
              <option value="ad_count_desc" ${sort === 'ad_count_desc' ? 'selected' : ''}>Most Ads</option>
              <option value="impressions_desc" ${sort === 'impressions_desc' ? 'selected' : ''}>Highest Impressions</option>
              <option value="name_asc" ${sort === 'name_asc' ? 'selected' : ''}>Name (A-Z)</option>
              <option value="name_desc" ${sort === 'name_desc' ? 'selected' : ''}>Name (Z-A)</option>
            </select>
            <button type="submit" class="btn btn-primary">Filter</button>
            ${isFiltered ? `<a href="/advertisers" class="btn btn-secondary">Reset</a>` : ''}
          </div>
        </form>

        <div class="results-header mt-6">
          <h2 class="text-xl font-bold text-main">
            ${q ? `Advertisers matching "${escapeHtml(q)}"` : 'All Tracked Brands'}
          </h2>
          <div class="results-count">
            Showing <strong>${advertisers.length}</strong> of <strong>${formatNumber(totalAdvertisers)}</strong> advertisers
          </div>
        </div>

        ${advertisers.length > 0 ? `
          <div class="advertisers-grid mt-4">
            ${advertisers.map(adv => `
              <a href="/advertisers/${encodeURIComponent(adv.slug)}" class="advertiser-card">
                <div class="adv-card-header">
                  ${renderAdvertiserAvatar(adv.name, adv.logo, 'lg')}
                  <div class="adv-card-title-group">
                    <h3 class="adv-card-name">${escapeHtml(adv.name)}</h3>
                    ${adv.website_domain ? `<span class="adv-card-domain">${escapeHtml(adv.website_domain)}</span>` : ''}
                  </div>
                </div>

                <div class="adv-stats-row">
                  <div class="adv-stat-pill">
                    <span class="adv-stat-val">${formatNumber(adv.ad_count)}</span>
                    <span class="adv-stat-label">Total Ads</span>
                  </div>
                  <div class="adv-stat-pill">
                    <span class="adv-stat-val">${formatNumber(adv.total_impressions)}</span>
                    <span class="adv-stat-label">Impressions</span>
                  </div>
                </div>

                <div class="adv-card-footer">
                  <span class="adv-activity">Active since ${formatDate(adv.first_seen)}</span>
                  <span class="adv-link-label">View Ads &rarr;</span>
                </div>
              </a>
            `).join('')}
          </div>

          <div class="pagination-root mt-8">
            ${renderPagination(page, totalPages, '/advertisers', { q, sort })}
          </div>
        ` : `
          <div class="empty-state mt-8">
            <h3 class="empty-state-title">No Advertisers Found</h3>
            <p class="empty-state-desc">Try adjusting your search criteria.</p>
            <a href="/advertisers" class="btn btn-primary mt-4">Browse All Advertisers</a>
          </div>
        `}
      </div>
    </section>
  `;

  const html = renderPageLayout({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    activeNav: 'advertisers',
    jsonLd,
    bodyContent,
    stats,
    robots,
    prevPageUrl,
    nextPageUrl,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
