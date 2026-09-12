/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: Individual Category Page SSR
   Route: GET /categories/:slug
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  escapeHtml,
  formatNumber,
  formatDate,
  renderAdCard,
  renderAdvertiserAvatar,
  renderPagination,
  renderPageLayout,
} from '../_template.js';

export async function onRequest(context) {
  const { env, request, params } = context;
  const url = new URL(request.url);
  const slug = decodeURIComponent(params.slug || '');

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  // Fetch category details
  let category = null;
  let ads = [];
  let totalAds = 0;
  let topAdvertisers = [];
  let stats = { totalAds: 0, totalAdvertisers: 0, totalImpressions: 0 };

  try {
    const catResult = await env.DB.prepare(
      'SELECT slug, name, title, description, ad_count, advertiser_count FROM categories WHERE slug = ?'
    ).bind(slug).first();

    if (!catResult) {
      return new Response('Category not found', { status: 404 });
    }
    category = catResult;

    // Fetch ads for this category with pagination
    const [adsResult, countResult, advResult, statsAds, statsAdv, statsImp] = await Promise.all([
      env.DB.prepare(`
        SELECT a.id, a.advertiser_slug, a.advertiser_name, a.advertiser_logo,
               a.website_url, a.website_domain, a.copy, a.description,
               a.media_url, a.published_date, a.impressions
        FROM ads a
        INNER JOIN ad_categories ac ON a.id = ac.ad_id
        WHERE ac.category_slug = ?
        ORDER BY a.impressions DESC, a.published_date DESC
        LIMIT ? OFFSET ?
      `).bind(slug, limit, offset).all(),

      env.DB.prepare(`
        SELECT COUNT(*) as count FROM ad_categories WHERE category_slug = ?
      `).bind(slug).first(),

      // Top advertisers in this category
      env.DB.prepare(`
        SELECT adv.slug, adv.name, adv.logo, adv.website_domain,
               adv.ad_count, adv.total_impressions
        FROM advertisers adv
        WHERE adv.slug IN (
          SELECT DISTINCT a.advertiser_slug
          FROM ads a
          INNER JOIN ad_categories ac ON a.id = ac.ad_id
          WHERE ac.category_slug = ?
        )
        ORDER BY adv.total_impressions DESC
        LIMIT 8
      `).bind(slug).all(),

      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
    ]);

    ads = adsResult?.results || [];
    totalAds = countResult?.count || 0;
    topAdvertisers = advResult?.results || [];
    stats = {
      totalAds: statsAds?.count || 0,
      totalAdvertisers: statsAdv?.count || 0,
      totalImpressions: statsImp?.total || 0,
    };
  } catch (err) {
    console.error('D1 Query Error in categories/[slug].js:', err);
    return new Response('Internal Server Error', { status: 500 });
  }

  const totalPages = Math.ceil(totalAds / limit) || 1;

  const pageTitle = page > 1
    ? `${category.name} ChatGPT Ads (Page ${page}) — ChatGPT Ads Library`
    : `${category.name} ChatGPT Ads — ChatGPT Ads Library`;

  const pageDescription = page > 1
    ? `Page ${page} of ${category.name} ads on ChatGPT. ${category.description}`
    : category.description;

  let canonicalUrl = `${url.origin}/categories/${encodeURIComponent(slug)}`;
  let robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  if (page > 1) {
    const canonicalUrlObj = new URL(`${url.origin}/categories/${encodeURIComponent(slug)}`);
    canonicalUrlObj.searchParams.set('page', page);
    canonicalUrl = canonicalUrlObj.toString();
    robots = 'noindex, follow';
  }

  const prevPageUrl = page > 1
    ? (page === 2
      ? `${url.origin}/categories/${encodeURIComponent(slug)}`
      : `${url.origin}/categories/${encodeURIComponent(slug)}?page=${page - 1}`)
    : null;
  const nextPageUrl = page < totalPages
    ? `${url.origin}/categories/${encodeURIComponent(slug)}?page=${page + 1}`
    : null;

  const firstAdImage = ads[0]?.media_url || null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'ChatGPT Ads Library',
        url: url.origin,
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: url.origin },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: `${url.origin}/categories` },
          { '@type': 'ListItem', position: 3, name: `${category.name} Ads`, item: canonicalUrl },
        ],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${category.name} ChatGPT Ads`,
      numberOfItems: totalAds,
      itemListElement: ads.map((ad, idx) => ({
        '@type': 'ListItem',
        position: offset + idx + 1,
        name: ad.copy,
        url: `${url.origin}/ads/${ad.id}`,
        image: ad.media_url,
      })),
    },
  ];

  const bodyContent = `
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs-bar" aria-label="Breadcrumb">
      <div class="container">
        <ol class="breadcrumbs-list">
          <li><a href="/">Home</a></li>
          <li><a href="/categories">Categories</a></li>
          <li aria-current="page">${escapeHtml(category.name)}</li>
        </ol>
      </div>
    </nav>

    <!-- Category Hero -->
    <section class="category-hero-section">
      <div class="container">
        <div class="category-hero-content animate-fade-in">
          <h1 class="category-hero-title">${escapeHtml(category.name)} <span class="text-accent">ChatGPT Ads</span></h1>
          <p class="category-hero-desc">${escapeHtml(category.description)}</p>
          <div class="category-hero-stats">
            <div class="hero-stat-card">
              <span class="stat-number">${formatNumber(totalAds)}</span>
              <span class="stat-title">Ads in Category</span>
            </div>
            <div class="hero-stat-card">
              <span class="stat-number">${formatNumber(category.advertiser_count)}</span>
              <span class="stat-title">Advertisers</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="browse-section">
      <div class="container">

        ${topAdvertisers.length > 0 ? `
          <!-- Top Advertisers in Category -->
          <div class="category-advertisers-section">
            <h2 class="section-heading">Top ${escapeHtml(category.name)} Advertisers</h2>
            <div class="category-advertisers-row">
              ${topAdvertisers.map(adv => `
                <a href="/advertisers/${encodeURIComponent(adv.slug)}" class="category-adv-chip" title="${escapeHtml(adv.name)} — ${formatNumber(adv.total_impressions)} impressions">
                  ${renderAdvertiserAvatar(adv.name, adv.logo, 'sm')}
                  <div class="category-adv-chip-info">
                    <span class="category-adv-chip-name">${escapeHtml(adv.name)}</span>
                    <span class="category-adv-chip-meta">${formatNumber(adv.total_impressions)} impressions</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Results Header -->
        <div class="results-header mt-6">
          <h2 class="text-xl font-bold text-main">
            ${page > 1 ? `${escapeHtml(category.name)} Ads — Page ${page}` : `All ${escapeHtml(category.name)} Ads`}
          </h2>
          <div class="results-count">
            Showing <strong>${ads.length}</strong> of <strong>${formatNumber(totalAds)}</strong> ads
          </div>
        </div>

        <!-- Ads Grid -->
        ${ads.length > 0 ? `
          <div class="ads-grid mt-4">
            ${ads.map(ad => renderAdCard(ad)).join('')}
          </div>

          <div class="pagination-root mt-8">
            ${renderPagination(page, totalPages, `/categories/${encodeURIComponent(slug)}`, {})}
          </div>
        ` : `
          <div class="empty-state mt-8">
            <h3 class="empty-state-title">No Ads Found</h3>
            <p class="empty-state-desc">No ads have been categorized under ${escapeHtml(category.name)} yet.</p>
            <a href="/categories" class="btn btn-primary mt-4">Browse All Categories</a>
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
    activeNav: 'categories',
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
