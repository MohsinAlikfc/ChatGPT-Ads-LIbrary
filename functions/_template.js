/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Functions — SSR HTML Template Engine
   Pure server-side template literals. Zero client JS required.
   ═══════════════════════════════════════════════════════════════════════════ */

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  const n = Number(num);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-US');
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getInitials(name) {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function renderAdvertiserAvatar(name, logoUrl, size = 'sm') {
  if (logoUrl) {
    return `
      <div class="advertiser-avatar avatar-${size}">
        <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(name)} logo" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'avatar-initials\\'>${getInitials(name)}</span>'"/>
      </div>
    `;
  }
  return `
    <div class="advertiser-avatar avatar-${size} avatar-fallback">
      <span class="avatar-initials">${getInitials(name)}</span>
    </div>
  `;
}

export function renderAdCard(ad) {
  const detailUrl = `/ads/${encodeURIComponent(ad.id)}`;
  const advertiserUrl = `/advertisers/${encodeURIComponent(ad.advertiser_slug || ad.advertiserSlug || '')}`;
  const advertiserName = ad.advertiser_name || ad.advertiserName || 'Sponsored';
  const advertiserLogo = ad.advertiser_logo || ad.advertiserLogo || null;
  const websiteDomain = ad.website_domain || ad.websiteDomain || '';
  const copy = ad.copy || '';
  const description = ad.description || '';
  const mediaUrl = ad.media_url || ad.mediaUrl || null;
  const publishedDate = ad.published_date || ad.publishedDate || null;
  const impressions = ad.impressions || 0;

  return `
    <article class="ad-card" data-ad-id="${escapeHtml(ad.id)}">
      <div class="ad-card-header">
        <a href="${advertiserUrl}" class="ad-advertiser-link" title="View all ads by ${escapeHtml(advertiserName)}">
          ${renderAdvertiserAvatar(advertiserName, advertiserLogo, 'sm')}
          <div class="ad-advertiser-info">
            <span class="ad-advertiser-name">${escapeHtml(advertiserName)}</span>
            ${websiteDomain ? `<span class="ad-domain">${escapeHtml(websiteDomain)}</span>` : ''}
          </div>
        </a>
        <span class="ad-date-badge" title="Published date">${formatDate(publishedDate)}</span>
      </div>

      ${mediaUrl ? `
        <div class="ad-media-wrapper">
          <a href="${detailUrl}" class="ad-media-link" aria-label="View ad details for ${escapeHtml(copy || advertiserName)}">
            <img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(copy || advertiserName)}" class="ad-media-img" loading="lazy" />
          </a>
        </div>
      ` : ''}

      <div class="ad-card-body">
        <h3 class="ad-copy-text"><a href="${detailUrl}">${escapeHtml(copy)}</a></h3>
        ${description ? `
          <p class="ad-description-text">${escapeHtml(description)}</p>
        ` : ''}
      </div>

      <div class="ad-card-footer">
        <div class="ad-impressions-badge" title="Estimated ad impressions">
          <svg class="badge-icon" viewBox="0 0 24 24"><use href="#icon-eye"></use></svg>
          <span>${formatNumber(impressions)} impressions</span>
        </div>

        <div class="ad-actions">
          <a href="${detailUrl}" class="btn btn-sm btn-primary">Details</a>
        </div>
      </div>
    </article>
  `;
}

export function renderHeader(active = 'home') {
  return `
    <header class="site-header">
      <div class="header-container container">
        <a href="/" class="brand-logo" aria-label="ChatGPT Ads Library Home">
          <div class="logo-badge">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">ChatGPT Ads Library</span>
            <span class="brand-tag">Transparency Archive</span>
          </div>
        </a>

        <nav class="nav-links" aria-label="Main Navigation">
          <a href="/" class="nav-link ${active === 'home' ? 'active' : ''}">Ads</a>
          <a href="/advertisers" class="nav-link ${active === 'advertisers' ? 'active' : ''}">Advertisers</a>
          <a href="/about" class="nav-link ${active === 'about' ? 'active' : ''}">About</a>
        </nav>
      </div>
    </header>
  `;
}

export function renderFooter(stats = {}) {
  const totalAds = stats.totalAds || 3157;
  const totalAdvertisers = stats.totalAdvertisers || 1359;
  const totalImpressions = stats.totalImpressions || 500000;

  return `
    <footer class="site-footer">
      <div class="container footer-content">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="brand-logo footer-logo">
              <div class="logo-badge">
                <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <div class="brand-text">
                <span class="brand-title">ChatGPT Ads Library</span>
              </div>
            </div>
            <p class="footer-desc">
              An independent, searchable archive of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions.
            </p>
          </div>

          <div class="footer-links-group">
            <h4 class="footer-heading">Navigation</h4>
            <ul class="footer-links-list">
              <li><a href="/">Ads</a></li>
              <li><a href="/advertisers">Advertisers</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </div>

          <div class="footer-links-group">
            <h4 class="footer-heading">Archive Metrics</h4>
            <div class="footer-stats-box">
              <div class="stat-mini-row">
                <span class="stat-mini-label">Indexed Ads</span>
                <span class="stat-mini-val">${formatNumber(totalAds)}</span>
              </div>
              <div class="stat-mini-row">
                <span class="stat-mini-label">Active Advertisers</span>
                <span class="stat-mini-val">${formatNumber(totalAdvertisers)}</span>
              </div>
              <div class="stat-mini-row">
                <span class="stat-mini-label">Total Impressions</span>
                <span class="stat-mini-val">${formatNumber(totalImpressions)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-disclaimer">
            <strong>Disclaimer:</strong> This is an independent research archive. ChatGPT Ads Library is not affiliated with, endorsed by, or associated with OpenAI Inc. or any indexed advertisers.
          </p>
          <p class="footer-copyright">
            &copy; ${new Date().getFullYear()} ChatGPT Ads Library. Open Transparency Archive.
          </p>
        </div>
      </div>
    </footer>
  `;
}

export function renderPagination(page, totalPages, baseUrl, queryParams = {}) {
  if (totalPages <= 1) return '';

  function buildUrl(p) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v != null && v !== '' && k !== 'page') params.set(k, String(v));
    });
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `${baseUrl}${qs ? `?${qs}` : ''}`;
  }

  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return `
    <div class="pagination-container" role="navigation" aria-label="Pagination">
      ${page > 1 ? `
        <a href="${buildUrl(page - 1)}" class="pagination-btn pagination-prev" aria-label="Previous page">
          <svg class="icon" viewBox="0 0 24 24"><use href="#icon-chevron-left"></use></svg>
          <span>Prev</span>
        </a>
      ` : `
        <button type="button" class="pagination-btn pagination-prev" disabled aria-label="Previous page">
          <svg class="icon" viewBox="0 0 24 24"><use href="#icon-chevron-left"></use></svg>
          <span>Prev</span>
        </button>
      `}

      <div class="pagination-pages">
        ${rangeWithDots.map(item => {
          if (item === '...') {
            return `<span class="pagination-dots">&hellip;</span>`;
          }
          if (item === page) {
            return `<span class="pagination-page-btn active" aria-current="page">${item}</span>`;
          }
          return `<a href="${buildUrl(item)}" class="pagination-page-btn" aria-label="Page ${item}">${item}</a>`;
        }).join('')}
      </div>

      ${page < totalPages ? `
        <a href="${buildUrl(page + 1)}" class="pagination-btn pagination-next" aria-label="Next page">
          <span>Next</span>
          <svg class="icon" viewBox="0 0 24 24"><use href="#icon-chevron-right"></use></svg>
        </a>
      ` : `
        <button type="button" class="pagination-btn pagination-next" disabled aria-label="Next page">
          <span>Next</span>
          <svg class="icon" viewBox="0 0 24 24"><use href="#icon-chevron-right"></use></svg>
        </button>
      `}
    </div>
  `;
}

export function renderPageLayout({
  title,
  description,
  canonicalUrl,
  ogImage,
  jsonLd,
  activeNav = 'home',
  bodyContent,
  stats = {},
  robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  prevPageUrl,
  nextPageUrl,
}) {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  ${prevPageUrl ? `<link rel="prev" href="${escapeHtml(prevPageUrl)}">` : ''}
  ${nextPageUrl ? `<link rel="next" href="${escapeHtml(nextPageUrl)}">` : ''}

  <!-- Open Graph -->
  <meta property="og:site_name" content="ChatGPT Ads Library">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : ''}

  <!-- Favicons & Manifest -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/site.webmanifest">

  <!-- Preconnect Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Static CSS -->
  <link rel="stylesheet" href="/styles.css">

  <!-- Schema.org JSON-LD Structured Data -->
  ${jsonLd ? Array.isArray(jsonLd) 
    ? jsonLd.map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n')
    : `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`
    : ''}
</head>
<body class="bg-surface text-main antialiased min-h-screen flex flex-col">
  <!-- SVG Sprite Definitions -->
  <svg style="display: none;" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <symbol id="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </symbol>
      <symbol id="icon-external" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </symbol>
      <symbol id="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </symbol>
      <symbol id="icon-chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </symbol>
      <symbol id="icon-chevron-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </symbol>
    </defs>
  </svg>

  ${renderHeader(activeNav)}

  <main class="main-content flex-1">
    ${bodyContent}
  </main>

  ${renderFooter(stats)}
</body>
</html>`;
}
