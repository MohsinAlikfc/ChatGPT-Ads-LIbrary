/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: Single Advertiser Profile SSR
   Route: GET /advertisers/[slug]
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  escapeHtml,
  formatDate,
  formatNumber,
  renderAdCard,
  renderAdvertiserAvatar,
  renderPagination,
  renderPageLayout,
} from '../_template.js';

export async function onRequest(context) {
  const { env, params, request } = context;
  const url = new URL(request.url);
  const rawSlug = params?.slug || params?.id || url.pathname.split('/').filter(Boolean).pop();
  const slug = Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug;

  if (!slug) {
    return new Response('Advertiser Slug Required', { status: 400 });
  }

  const sort = url.searchParams.get('sort') || 'date_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  const sortMap = {
    date_desc: 'published_date DESC, impressions DESC',
    date_asc: 'published_date ASC, impressions DESC',
    impressions_desc: 'impressions DESC, published_date DESC',
    impressions_asc: 'impressions ASC, published_date DESC',
  };
  const orderBy = sortMap[sort] || sortMap.date_desc;

  let adv = null;
  let ads = [];
  let totalAds = 0;
  let stats = { totalAds: 0, totalAdvertisers: 0, totalImpressions: 0 };

  try {
    const [advResult, adsResult, countResult, statsAds, statsAdv, statsImp] = await Promise.all([
      env.DB.prepare('SELECT * FROM advertisers WHERE slug = ?').bind(slug).first(),
      env.DB.prepare(`
        SELECT id, advertiser_slug, advertiser_name, advertiser_logo,
               advertiser_page_url, website_url, website_domain, copy,
               description, media_url, published_date, impressions
        FROM ads
        WHERE advertiser_slug = ?
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `).bind(slug, limit, offset).all(),
      env.DB.prepare('SELECT COUNT(*) as count FROM ads WHERE advertiser_slug = ?').bind(slug).first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
    ]);

    adv = advResult;
    ads = adsResult?.results || [];
    totalAds = countResult?.count || 0;
    stats = {
      totalAds: statsAds?.count || 0,
      totalAdvertisers: statsAdv?.count || 0,
      totalImpressions: statsImp?.total || 0,
    };
  } catch (err) {
    console.error('D1 Query Error in advertisers/[slug].js:', err);
  }

  if (!adv) {
    const notFoundBody = `
      <div class="container text-center py-16 max-w-lg mx-auto">
        <div class="not-found-code font-mono text-emerald font-bold text-6xl">404</div>
        <h1 class="page-title mt-4">Advertiser Not Found</h1>
        <p class="page-subtitle mt-2 text-muted">
          No advertiser found matching identifier: <code>${escapeHtml(slug)}</code>.
        </p>
        <div class="mt-8">
          <a href="/advertisers" class="btn btn-primary">Browse Advertisers Directory</a>
        </div>
      </div>
    `;

    const notFoundHtml = renderPageLayout({
      title: 'Advertiser Not Found — ChatGPT Ads Library',
      description: 'The requested advertiser profile was not found.',
      canonicalUrl: `${url.origin}/advertisers/${slug}`,
      activeNav: 'advertisers',
      bodyContent: notFoundBody,
      stats,
      robots: 'noindex, follow',
    });

    return new Response(notFoundHtml, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    });
  }

  const totalPages = Math.ceil(totalAds / limit) || 1;
  const pageTitle = page > 1 
    ? `${adv.name} Ads & Campaigns — ChatGPT Ads Library (Page ${page})`
    : `${adv.name} Ads & Campaigns — ChatGPT Ads Library`;
  const pageDescription = `Explore all ${formatNumber(adv.ad_count)} sponsored ChatGPT ad placements and copy variations running by ${adv.name}.`;
  const isFiltered = Boolean(sort && sort !== 'date_desc');
  let canonicalUrl = `${url.origin}/advertisers/${adv.slug}`;
  let robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  if (isFiltered) {
    canonicalUrl = `${url.origin}/advertisers/${adv.slug}`;
    robots = 'noindex, follow';
  } else if (page > 1) {
    const canonicalUrlObj = new URL(`${url.origin}/advertisers/${adv.slug}`);
    canonicalUrlObj.searchParams.set('page', page);
    canonicalUrl = canonicalUrlObj.toString();
  }

  const getPageUrl = (p) => {
    const pUrl = new URL(`${url.origin}/advertisers/${adv.slug}`);
    if (sort && sort !== 'date_desc') pUrl.searchParams.set('sort', sort);
    if (p > 1) pUrl.searchParams.set('page', p);
    return pUrl.toString();
  };

  const prevPageUrl = page > 1 ? getPageUrl(page - 1) : null;
  const nextPageUrl = page < totalPages ? getPageUrl(page + 1) : null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: adv.name,
      url: adv.website_url || undefined,
      image: adv.logo || undefined,
      description: pageDescription,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Explore Ads', item: url.origin },
        { '@type': 'ListItem', position: 2, name: 'Advertisers', item: `${url.origin}/advertisers` },
        { '@type': 'ListItem', position: 3, name: adv.name, item: canonicalUrl }
      ]
    }
  ];

  const bodyContent = `
    <div class="container py-8">
      <nav class="breadcrumb-bar" aria-label="Breadcrumb">
        <a href="/">Explore Ads</a>
        <span class="breadcrumb-sep">/</span>
        <a href="/advertisers">Advertisers</a>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${escapeHtml(adv.name)}</span>
      </nav>

      <!-- Advertiser Hero Header -->
      <div class="advertiser-hero-card">
        <div class="adv-hero-left">
          ${renderAdvertiserAvatar(adv.name, adv.logo, 'xl')}
          <div class="adv-hero-titles">
            <h1 class="adv-hero-name">${escapeHtml(adv.name)}</h1>
            ${adv.website_url ? `
              <a href="${escapeHtml(adv.website_url)}" target="_blank" rel="nofollow noopener noreferrer" class="adv-hero-domain">
                ${escapeHtml(adv.website_domain || adv.website_url)}
                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-external"></use></svg>
              </a>
            ` : ''}
          </div>
        </div>

        <div class="adv-hero-stats">
          <div class="hero-stat-item">
            <span class="hero-stat-num">${formatNumber(adv.ad_count)}</span>
            <span class="hero-stat-label">Total Ads</span>
          </div>
          <div class="hero-stat-item">
            <span class="hero-stat-num">${formatNumber(adv.total_impressions)}</span>
            <span class="hero-stat-label">Total Impressions</span>
          </div>
          <div class="hero-stat-item">
            <span class="hero-stat-num">${formatDate(adv.first_seen)}</span>
            <span class="hero-stat-label">First Seen</span>
          </div>
          <div class="hero-stat-item">
            <span class="hero-stat-num">${formatDate(adv.last_seen)}</span>
            <span class="hero-stat-label">Last Seen</span>
          </div>
        </div>
      </div>

      <!-- Campaign Ads Grid Section -->
      <section class="mt-10">
        <div class="section-header-row">
          <h2 class="section-title">Sponsored Creatives (${formatNumber(totalAds)})</h2>
          <form method="GET" action="/advertisers/${encodeURIComponent(adv.slug)}" class="sort-form">
            <select name="sort" class="form-select filter-select-sm" onchange="this.form.submit()" aria-label="Sort ads">
              <option value="date_desc" ${sort === 'date_desc' ? 'selected' : ''}>Newest First</option>
              <option value="date_asc" ${sort === 'date_asc' ? 'selected' : ''}>Oldest First</option>
              <option value="impressions_desc" ${sort === 'impressions_desc' ? 'selected' : ''}>Highest Impressions</option>
              <option value="impressions_asc" ${sort === 'impressions_asc' ? 'selected' : ''}>Lowest Impressions</option>
            </select>
          </form>
        </div>

        ${ads.length > 0 ? `
          <div class="ads-grid mt-4">
            ${ads.map(a => renderAdCard(a)).join('')}
          </div>

          <div class="pagination-root mt-8">
            ${renderPagination(page, totalPages, `/advertisers/${encodeURIComponent(adv.slug)}`, { sort })}
          </div>
        ` : `
          <div class="empty-state mt-8">
            <p>No ads recorded for this advertiser.</p>
          </div>
        `}
      </section>
    </div>
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
