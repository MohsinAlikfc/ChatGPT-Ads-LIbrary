/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: Individual Ad Detail SSR
   Route: GET /ads/[slug]
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  escapeHtml,
  formatDate,
  formatNumber,
  renderAdCard,
  renderAdvertiserAvatar,
  renderPageLayout,
} from '../_template.js';

export async function onRequest(context) {
  const { env, params, request } = context;
  const url = new URL(request.url);
  const rawSlug = params?.slug || params?.id || url.pathname.split('/').filter(Boolean).pop();
  const slug = Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug;

  if (!slug) {
    return new Response('Ad Identifier Required', { status: 400 });
  }

  let ad = null;
  let relatedAds = [];
  let stats = { totalAds: 0, totalAdvertisers: 0, totalImpressions: 0 };

  try {
    const [adResult, statsAds, statsAdv, statsImp] = await Promise.all([
      env.DB.prepare(`
        SELECT id, advertiser_slug, advertiser_name, advertiser_logo,
               advertiser_page_url, website_url, website_domain, copy,
               description, media_url, published_date, impressions
        FROM ads
        WHERE id = ? OR advertiser_slug = ?
        LIMIT 1
      `).bind(slug, slug).first(),

      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
    ]);

    ad = adResult;
    stats = {
      totalAds: statsAds?.count || 0,
      totalAdvertisers: statsAdv?.count || 0,
      totalImpressions: statsImp?.total || 0,
    };

    if (ad) {
      const related = await env.DB.prepare(`
        SELECT id, advertiser_slug, advertiser_name, advertiser_logo,
               website_domain, copy, description, media_url,
               published_date, impressions
        FROM ads
        WHERE advertiser_slug = ? AND id != ?
        ORDER BY impressions DESC
        LIMIT 4
      `).bind(ad.advertiser_slug, ad.id).all();

      relatedAds = related?.results || [];
    }
  } catch (err) {
    console.error('D1 Query Error in ads/[slug].js:', err);
  }

  // Handle 404
  if (!ad) {
    const notFoundBody = `
      <div class="container text-center py-16 max-w-lg mx-auto">
        <div class="not-found-code font-mono text-emerald font-bold text-6xl">404</div>
        <h1 class="page-title mt-4">Ad Record Not Found</h1>
        <p class="page-subtitle mt-2 text-muted">
          The requested sponsored placement was not found in the archive.
        </p>
        <div class="mt-8">
          <a href="/" class="btn btn-primary">Browse All Ads</a>
        </div>
      </div>
    `;

    const notFoundHtml = renderPageLayout({
      title: 'Ad Not Found — ChatGPT Ads Library',
      description: 'The requested advertisement was not found in the transparency archive.',
      canonicalUrl: `${url.origin}/ads/${slug}`,
      activeNav: 'home',
      bodyContent: notFoundBody,
      stats,
      robots: 'noindex, follow',
    });

    return new Response(notFoundHtml, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    });
  }

  const pageTitle = `${ad.advertiser_name} Ad (${ad.id}) — ChatGPT Ads Library`;
  const pageDescription = `Sponsored placement by ${ad.advertiser_name} on ChatGPT: "${ad.copy || ''}". Transparency records, ad creative, and estimated impressions.`;
  const canonicalUrl = `${url.origin}/ads/${ad.id}`;

  // Schema.org CreativeWork JSON-LD
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: ad.copy || ad.advertiser_name,
      headline: ad.copy,
      description: ad.description || ad.copy,
      url: canonicalUrl,
      image: ad.media_url || undefined,
      datePublished: ad.published_date,
      creator: {
        '@type': 'Organization',
        name: ad.advertiser_name,
        url: ad.website_url || undefined,
      },
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: Number(ad.impressions || 0),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Explore Ads', item: url.origin },
        { '@type': 'ListItem', position: 2, name: ad.advertiser_name, item: `${url.origin}/advertisers/${ad.advertiser_slug}` },
        { '@type': 'ListItem', position: 3, name: `Ad #${ad.id}`, item: canonicalUrl }
      ]
    }
  ];

  const bodyContent = `
    <div class="container py-8">
      <nav class="breadcrumb-bar" aria-label="Breadcrumb">
        <a href="/">Explore Ads</a>
        <span class="breadcrumb-sep">/</span>
        <a href="/advertisers/${encodeURIComponent(ad.advertiser_slug)}">${escapeHtml(ad.advertiser_name)}</a>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Ad #${escapeHtml(ad.id)}</span>
      </nav>

      <div class="ad-detail-layout">
        <!-- Media Column -->
        <div class="ad-detail-media-col">
          ${ad.media_url ? `
            <div class="ad-detail-media-card">
              <img src="${escapeHtml(ad.media_url)}" alt="Sponsored ad by ${escapeHtml(ad.advertiser_name)}: ${escapeHtml(ad.copy || '')}" class="detail-full-img" />
            </div>
          ` : `
            <div class="ad-detail-no-media">
              <p>No media creative asset was attached to this sponsored result.</p>
            </div>
          `}
        </div>

        <!-- Info Column -->
        <div class="ad-detail-info-col">
          <div class="ad-detail-card">
            <div class="detail-advertiser-header">
              <a href="/advertisers/${encodeURIComponent(ad.advertiser_slug)}" class="detail-advertiser-profile">
                ${renderAdvertiserAvatar(ad.advertiser_name, ad.advertiser_logo, 'lg')}
                <div>
                  <h1 class="detail-advertiser-name">${escapeHtml(ad.advertiser_name)}</h1>
                  ${ad.website_domain ? `<span class="detail-advertiser-domain">${escapeHtml(ad.website_domain)}</span>` : ''}
                </div>
              </a>
            </div>

            <div class="detail-section">
              <h2 class="detail-section-label">Ad Copy &amp; Text</h2>
              <div class="detail-copy-box">
                <blockquote class="detail-copy-content">${escapeHtml(ad.copy || 'No copy text available.')}</blockquote>
              </div>
              ${ad.description ? `
                <div class="detail-desc-box">
                  <span class="detail-desc-label">Subtext / Description:</span>
                  <p class="detail-desc-content">${escapeHtml(ad.description)}</p>
                </div>
              ` : ''}
            </div>

            <div class="detail-section">
              <h2 class="detail-section-label">Archive Transparency Data</h2>
              <div class="meta-data-table">
                <div class="meta-row">
                  <span class="meta-key">Ad Identifier</span>
                  <span class="meta-val font-mono">${escapeHtml(ad.id)}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-key">Published Date</span>
                  <span class="meta-val">${formatDate(ad.published_date)}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-key">Estimated Impressions</span>
                  <span class="meta-val font-bold text-emerald">${formatNumber(ad.impressions)}</span>
                </div>
                ${ad.website_url ? `
                  <div class="meta-row">
                    <span class="meta-key">Landing URL</span>
                    <span class="meta-val">
                      <a href="${escapeHtml(ad.website_url)}" target="_blank" rel="nofollow noopener noreferrer" class="external-link">
                        ${escapeHtml(ad.website_domain || ad.website_url)}
                        <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-external"></use></svg>
                      </a>
                    </span>
                  </div>
                ` : ''}

              </div>
            </div>

            <div class="detail-actions-bar">
              <a href="/advertisers/${encodeURIComponent(ad.advertiser_slug)}" class="btn btn-primary">
                All Ads from ${escapeHtml(ad.advertiser_name)}
              </a>
            </div>
          </div>
        </div>
      </div>

      ${relatedAds.length > 0 ? `
        <div class="related-ads-section mt-12">
          <h2 class="related-heading">More Ads from ${escapeHtml(ad.advertiser_name)}</h2>
          <div class="ads-grid mt-4">
            ${relatedAds.map(r => renderAdCard(r)).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const html = renderPageLayout({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    ogImage: ad.media_url,
    jsonLd,
    activeNav: 'home',
    bodyContent,
    stats,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
