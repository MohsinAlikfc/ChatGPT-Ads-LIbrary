/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: Categories Index SSR
   Route: GET /categories
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  escapeHtml,
  formatNumber,
  renderPageLayout,
} from '../_template.js';

// Category icons — simple SVG path data keyed by slug
const CATEGORY_ICONS = {
  'ai':              '<path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 14 22h-4a7 7 0 0 1-6.73-3H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/><circle cx="10" cy="15" r="1"/><circle cx="14" cy="15" r="1"/>',
  'software':        '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  'business':        '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/>',
  'finance':         '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'marketing':       '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'e-commerce':      '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  'real-estate':     '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'home':            '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'automotive':      '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  'healthcare':      '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  'education':       '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'careers':         '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  'travel':          '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  'legal':           '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'electronics':     '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  'fitness':         '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
  'food':            '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
  'beauty':          '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'family':          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'pets':            '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  'entertainment':   '<rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
  'events':          '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  'insurance':       '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'personal-finance':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'industrial':      '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>',
  'logistics':       '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  'energy':          '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'agriculture':     '<path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 10 10"/><path d="M19 12h3a10 10 0 0 1-10 10"/><path d="M12 8a6 6 0 0 0-6-6c0 3.31 2.69 6 6 6z"/><path d="M12 8a6 6 0 0 1 6-6c0 3.31-2.69 6-6 6z"/>',
  'cybersecurity':   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'government':      '<line x1="12" y1="2" x2="12" y2="6"/><polyline points="2 12 12 6 22 12"/><rect x="3" y="12" width="18" height="9"/><line x1="7" y1="21" x2="7" y2="15"/><line x1="12" y1="21" x2="12" y2="15"/><line x1="17" y1="21" x2="17" y2="15"/>',
  'nonprofit':       '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  'lifestyle':       '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
};

function getCategoryIcon(slug) {
  const svgContent = CATEGORY_ICONS[slug] || CATEGORY_ICONS['business'];
  return `<svg class="category-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>`;
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  let categories = [];
  let stats = { totalAds: 0, totalAdvertisers: 0, totalImpressions: 0 };

  try {
    const [catResult, statsAds, statsAdv, statsImp] = await Promise.all([
      env.DB.prepare('SELECT slug, name, title, description, ad_count, advertiser_count FROM categories ORDER BY ad_count DESC').all(),
      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
    ]);

    categories = catResult?.results || [];
    stats = {
      totalAds: statsAds?.count || 0,
      totalAdvertisers: statsAdv?.count || 0,
      totalImpressions: statsImp?.total || 0,
    };
  } catch (err) {
    console.error('D1 Query Error in categories/index.js:', err);
  }

  const pageTitle = 'Ad Categories — ChatGPT Ads Library';
  const pageDescription = 'Browse ChatGPT ads by category. Explore AI, Software, Marketing, Finance, Healthcare, and 27 more industry categories with real ad examples and advertiser data.';
  const canonicalUrl = `${url.origin}/categories`;

  const jsonLd = {
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
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categories.length,
      itemListElement: categories.map((cat, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: `${cat.name} ChatGPT Ads`,
        url: `${url.origin}/categories/${cat.slug}`,
      })),
    },
  };

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center">
        <div class="hero-badge animate-fade-in">
          <span class="badge-dot"></span>
          <span>32 Industry Categories</span>
        </div>
        <h1 class="page-title animate-fade-in">Ad Categories</h1>
        <p class="page-subtitle animate-fade-in">
          Browse ChatGPT ads organized by industry. Each category shows relevant ads, top advertisers, and performance data.
        </p>
      </div>
    </section>

    <section class="browse-section">
      <div class="container">
        <div class="categories-grid">
          ${categories.map(cat => `
            <a href="/categories/${encodeURIComponent(cat.slug)}" class="category-card" id="cat-${escapeHtml(cat.slug)}">
              <div class="category-card-icon-wrap">
                ${getCategoryIcon(cat.slug)}
              </div>
              <div class="category-card-content">
                <h2 class="category-card-name">${escapeHtml(cat.name)}</h2>
                <p class="category-card-desc">${escapeHtml(cat.description).substring(0, 100)}${cat.description.length > 100 ? '...' : ''}</p>
              </div>
              <div class="category-card-stats">
                <span class="category-stat">
                  <strong>${formatNumber(cat.ad_count)}</strong> ads
                </span>
                <span class="category-stat-divider"></span>
                <span class="category-stat">
                  <strong>${formatNumber(cat.advertiser_count)}</strong> advertisers
                </span>
              </div>
              <span class="category-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  const html = renderPageLayout({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    jsonLd,
    activeNav: 'categories',
    bodyContent,
    stats,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
