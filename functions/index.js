/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: Homepage & Ads Directory SSR
   Route: GET /
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  escapeHtml,
  formatNumber,
  renderAdCard,
  renderPagination,
  renderPageLayout,
} from './_template.js';

function escapeLike(val) {
  return String(val).replace(/[\\%_]/g, '\\$&');
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // Parse query filters
  const q = url.searchParams.get('q')?.trim() || '';
  const advertiser = url.searchParams.get('advertiser')?.trim() || '';
  const sort = url.searchParams.get('sort') || 'date_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const minImpressions = url.searchParams.get('min_impressions')
    ? Number(url.searchParams.get('min_impressions'))
    : null;
  const limit = 24;
  const offset = (page - 1) * limit;

  // Build SQL conditions
  const conditions = [];
  const values = [];

  if (q) {
    const like = `%${escapeLike(q)}%`;
    conditions.push(
      "(advertiser_name LIKE ? ESCAPE '\\' OR website_domain LIKE ? ESCAPE '\\' OR copy LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')"
    );
    values.push(like, like, like, like);
  }

  if (advertiser) {
    conditions.push('advertiser_slug = ?');
    values.push(advertiser);
  }

  if (minImpressions != null && !isNaN(minImpressions)) {
    conditions.push('impressions >= ?');
    values.push(minImpressions);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap = {
    date_desc: 'published_date DESC, impressions DESC',
    date_asc: 'published_date ASC, impressions DESC',
    impressions_desc: 'impressions DESC, published_date DESC',
    impressions_asc: 'impressions ASC, published_date DESC',
  };
  const orderBy = sortMap[sort] || sortMap.date_desc;

  // Execute D1 queries
  let ads = [];
  let totalAds = 0;
  let stats = { totalAds: 0, totalAdvertisers: 0, totalImpressions: 0, maxDate: null };
  let allAdvertisers = [];

  try {
    const [adsResult, countResult, statsAds, statsAdv, statsImp, statsDate, advList] = await Promise.all([
      env.DB.prepare(`
        SELECT id, advertiser_slug, advertiser_name, advertiser_logo,
               advertiser_page_url, website_url, website_domain, copy,
               description, media_url, published_date, impressions
        FROM ads
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `).bind(...values, limit, offset).all(),

      env.DB.prepare(`SELECT COUNT(*) as count FROM ads ${whereClause}`).bind(...values).first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
      env.DB.prepare('SELECT MAX(published_date) as maxDate FROM ads').first(),
      env.DB.prepare('SELECT slug, name, ad_count FROM advertisers ORDER BY ad_count DESC LIMIT 100').all(),
    ]);

    ads = adsResult?.results || [];
    totalAds = countResult?.count || 0;
    stats = {
      totalAds: statsAds?.count || totalAds,
      totalAdvertisers: statsAdv?.count || 0,
      totalImpressions: statsImp?.total || 0,
      maxDate: statsDate?.maxDate || null,
    };
    allAdvertisers = advList?.results || [];
  } catch (err) {
    console.error('D1 Query Error in index.js:', err);
  }

  const totalPages = Math.ceil(totalAds / limit) || 1;
  const isFiltered = Boolean(q || advertiser || minImpressions || (sort && sort !== 'date_desc'));

  // SEO Titles and Meta Descriptions
  const pageTitle = q
    ? `Search results for "${q}" — ChatGPT Ads Library`
    : page > 1
      ? `ChatGPT Ads Library — Browse & Search Ads on ChatGPT (Page ${page})`
      : 'ChatGPT Ads Library — Browse & Search Ads on ChatGPT';

  const pageDescription = q
    ? `Browse ChatGPT ads matching "${q}". Filter by advertiser, date, and impressions.`
    : page > 1
      ? `Page ${page} of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions.`
      : 'An independent, searchable archive of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions.';

  let canonicalUrl = `${url.origin}/`;
  let robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  if (isFiltered) {
    canonicalUrl = `${url.origin}/`;
    robots = 'noindex, follow';
  } else if (page > 1) {
    const canonicalUrlObj = new URL(url.origin);
    canonicalUrlObj.pathname = '/';
    canonicalUrlObj.searchParams.set('page', page);
    canonicalUrl = canonicalUrlObj.toString();
  }

  const getPageUrl = (p) => {
    const pUrl = new URL(url.origin);
    pUrl.pathname = '/';
    if (q) pUrl.searchParams.set('q', q);
    if (advertiser) pUrl.searchParams.set('advertiser', advertiser);
    if (sort && sort !== 'date_desc') pUrl.searchParams.set('sort', sort);
    if (minImpressions) pUrl.searchParams.set('min_impressions', minImpressions);
    if (p > 1) pUrl.searchParams.set('page', p);
    return pUrl.toString();
  };

  const prevPageUrl = page > 1 ? getPageUrl(page - 1) : null;
  const nextPageUrl = page < totalPages ? getPageUrl(page + 1) : null;

  const firstAdImage = ads[0]?.media_url || `${url.origin}/og-image.jpg`;

  // JSON-LD Schemas
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${url.origin}/#website`,
      url: url.origin,
      name: 'ChatGPT Ads Library',
      description: pageDescription,
      author: {
        '@type': 'Organization',
        name: 'ChatGPT Ads Library',
        url: url.origin,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${url.origin}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ChatGPT Ads Library',
      url: url.origin,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url.origin}/#webpage`,
      url: canonicalUrl,
      name: pageTitle,
      description: pageDescription,
      isPartOf: {
        '@id': `${url.origin}/#website`,
      },
      dateModified: stats.maxDate || undefined,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', '.hero-description'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      '@id': `${url.origin}/#dataset`,
      name: 'ChatGPT Ads Library — Ad Archive',
      description: 'A searchable archive of advertisements running across ChatGPT, including ad creative, advertiser details, impression counts, and publication dates.',
      url: url.origin,
      creator: {
        '@type': 'Organization',
        name: 'ChatGPT Ads Library',
        url: url.origin,
      },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      isAccessibleForFree: true,
      size: `${stats.totalAds} ads from ${stats.totalAdvertisers} advertisers`,
      dateModified: stats.maxDate || undefined,
      keywords: ['ChatGPT ads', 'AI advertising', 'ad transparency', 'OpenAI ads', 'digital advertising'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: ads.map((ad, idx) => ({
        '@type': 'ListItem',
        position: offset + idx + 1,
        name: ad.copy,
        url: `${url.origin}/ads/${ad.id}`,
        image: ad.media_url,
        description: ad.description,
      })),
    },
  ];

  // Render Body Content
  const bodyContent = `
    <!-- Hero Section -->
    <section class="hero-section" aria-labelledby="hero-heading">
      <div class="container hero-container">
        <div class="hero-badge animate-fade-in">
          <span class="badge-dot"></span>
          <span>Open AI Ad Transparency Archive</span>
        </div>
        <h1 id="hero-heading" class="hero-title animate-fade-in">
          ChatGPT Ads Library
        </h1>
        <p class="hero-subtitle hero-description animate-fade-in">
          Browse and search ads running across ChatGPT. Filter by advertiser, date, and impressions to see what's live.
        </p>

        <!-- Live Archive Metrics -->
        <div class="hero-stats-grid animate-fade-in" aria-label="Library statistics">
          <div class="hero-stat-card">
            <span class="stat-number">${formatNumber(stats.totalAds)}</span>
            <span class="stat-title">Indexed Ads</span>
          </div>
          <div class="hero-stat-card">
            <span class="stat-number">${formatNumber(stats.totalAdvertisers)}</span>
            <span class="stat-title">Active Advertisers</span>
          </div>
          <div class="hero-stat-card">
            <span class="stat-number">${formatNumber(stats.totalImpressions)}</span>
            <span class="stat-title">Estimated Impressions</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Search & Filter Bar (HTML Form) -->
    <section class="browse-section">
      <div class="container">
        <form method="GET" action="/" class="search-filter-bar" role="search">
          <div class="search-box-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24"><use href="#icon-search"></use></svg>
            <input
              type="search"
              name="q"
              value="${escapeHtml(q)}"
              class="search-input"
              placeholder="Search by keyword, advertiser name, domain, or ad copy..."
              autocomplete="off"
            />
          </div>

          <div class="filter-controls-group">
            <select name="advertiser" class="form-select filter-select" aria-label="Filter by advertiser">
              <option value="">All Advertisers</option>
              ${allAdvertisers.map(a => `
                <option value="${escapeHtml(a.slug)}" ${advertiser === a.slug ? 'selected' : ''}>
                  ${escapeHtml(a.name)} (${a.ad_count})
                </option>
              `).join('')}
            </select>

            <select name="sort" class="form-select filter-select" aria-label="Sort ads">
              <option value="date_desc" ${sort === 'date_desc' ? 'selected' : ''}>Newest First</option>
              <option value="date_asc" ${sort === 'date_asc' ? 'selected' : ''}>Oldest First</option>
              <option value="impressions_desc" ${sort === 'impressions_desc' ? 'selected' : ''}>Highest Impressions</option>
              <option value="impressions_asc" ${sort === 'impressions_asc' ? 'selected' : ''}>Lowest Impressions</option>
            </select>

            <button type="submit" class="btn btn-primary">Filter</button>
            ${isFiltered ? `<a href="/" class="btn btn-secondary">Reset</a>` : ''}
          </div>
        </form>

        <!-- Results Header -->
        <div class="results-header mt-6">
          <h2 class="text-xl font-bold text-main">
            ${q ? `Results for "${escapeHtml(q)}"` : 'All ChatGPT Sponsored Placements'}
          </h2>
          <div class="results-count">
            Showing <strong>${ads.length}</strong> of <strong>${formatNumber(totalAds)}</strong> ads found
          </div>
        </div>

        <!-- Server-Rendered Ads Grid -->
        ${ads.length > 0 ? `
          <div class="ads-grid mt-4">
            ${ads.map(ad => renderAdCard(ad)).join('')}
          </div>

          <div class="pagination-root mt-8">
            ${renderPagination(page, totalPages, '/', { q, advertiser, sort, min_impressions: minImpressions })}
          </div>
        ` : `
          <div class="empty-state mt-8">
            <h3 class="empty-state-title">No Ads Found</h3>
            <p class="empty-state-desc">Try clearing your search query or adjusting your filters.</p>
            <a href="/" class="btn btn-primary mt-4">Browse All Ads</a>
          </div>
        `}
      </div>
    </section>
  `;

  const html = renderPageLayout({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    ogImage: firstAdImage,
    jsonLd,
    activeNav: 'home',
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
