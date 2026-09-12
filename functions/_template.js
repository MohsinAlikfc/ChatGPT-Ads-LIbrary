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
    <header class="site-header" id="site-header">
      <div class="header-container container">
        <!-- Brand Logo -->
        <a href="/" class="brand-logo" aria-label="ChatGPT Ads Library — Homepage">
          <div class="logo-badge">
            <svg class="logo-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div class="brand-text-wrap">
            <span class="brand-title">ChatGPT Ads <span class="brand-title-accent">Library</span></span>
            <span class="brand-badge-status"><span class="pulse-dot"></span> Live Archive</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="nav-menu" aria-label="Main Navigation">
          <a href="/" class="nav-item ${active === 'home' ? 'active' : ''}">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Browse Ads</span>
          </a>
          <a href="/advertisers" class="nav-item ${active === 'advertisers' ? 'active' : ''}">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Advertisers</span>
          </a>
          <a href="/categories" class="nav-item ${active === 'categories' ? 'active' : ''}">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            <span>Categories</span>
          </a>
          <a href="/about" class="nav-item ${active === 'about' ? 'active' : ''}">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>About</span>
          </a>
        </nav>

        <!-- Header Actions -->
        <div class="header-actions">
          <!-- Quick Search Link -->
          <a href="/#search" class="quick-search-btn" title="Search ads and advertisers">
            <svg class="header-action-icon" viewBox="0 0 24 24"><use href="#icon-search"></use></svg>
            <span class="quick-search-text">Search...</span>
          </a>

          <!-- Light / Dark Mode Toggle Button -->
          <button type="button" class="theme-toggle-btn" id="theme-toggle-btn" onclick="toggleTheme()" aria-label="Toggle light and dark theme" title="Toggle theme">
            <span class="theme-icon-container">
              <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </span>
          </button>

          <!-- Mobile Menu Toggle Button -->
          <button type="button" class="mobile-menu-toggle-btn" id="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Toggle mobile navigation menu" aria-expanded="false">
            <svg class="menu-open-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <svg class="menu-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer" id="mobile-menu">
        <div class="container mobile-drawer-inner">
          <nav class="mobile-nav-items">
            <a href="/" class="mobile-nav-link ${active === 'home' ? 'active' : ''}">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>Browse All Ads</span>
            </a>
            <a href="/advertisers" class="mobile-nav-link ${active === 'advertisers' ? 'active' : ''}">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Top Advertisers</span>
            </a>
            <a href="/categories" class="mobile-nav-link ${active === 'categories' ? 'active' : ''}">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              <span>Ad Categories</span>
            </a>
            <a href="/about" class="mobile-nav-link ${active === 'about' ? 'active' : ''}">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>About & Transparency</span>
            </a>
          </nav>
        </div>
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
      <div class="footer-top-accent"></div>
      <div class="container footer-content">
        <div class="footer-grid">
          <!-- Col 1: Brand & Mission -->
          <div class="footer-brand-col">
            <a href="/" class="footer-brand-logo" aria-label="ChatGPT Ads Library">
              <div class="logo-badge logo-badge-sm">
                <svg class="logo-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <span class="footer-brand-name">ChatGPT Ads <span class="brand-title-accent">Library</span></span>
            </a>
            <p class="footer-mission-text">
              An independent, searchable archive documenting sponsored prompts, citations, and ads running across ChatGPT. Dedicated to open AI advertising transparency.
            </p>
            <div class="footer-status-tag">
              <span class="pulse-dot"></span>
              <span>Live Tracking &amp; Analysis</span>
            </div>
          </div>

          <!-- Col 2: Navigation Links -->
          <div class="footer-nav-col">
            <h4 class="footer-col-title">Archive Explorer</h4>
            <ul class="footer-links-list">
              <li><a href="/">Browse All Ads</a></li>
              <li><a href="/advertisers">Top Advertisers</a></li>
              <li><a href="/categories">Ad Categories</a></li>
              <li><a href="/?sort=impressions_desc">Highest Impressions</a></li>
              <li><a href="/?sort=date_desc">Latest Ad Additions</a></li>
            </ul>
          </div>

          <!-- Col 3: Transparency & Project -->
          <div class="footer-nav-col">
            <h4 class="footer-col-title">Transparency</h4>
            <ul class="footer-links-list">
              <li><a href="/about">About Archive</a></li>
              <li><a href="/about#methodology">Methodology</a></li>
              <li><a href="/about#faq">Frequently Asked Questions</a></li>
              <li><a href="/advertisers">Advertiser Index</a></li>
            </ul>
          </div>

          <!-- Col 4: Archive Live Stats Card -->
          <div class="footer-stats-col">
            <h4 class="footer-col-title">Archive Metrics</h4>
            <div class="footer-metrics-card">
              <div class="metric-row">
                <span class="metric-label">Indexed Ads</span>
                <span class="metric-value font-mono">${formatNumber(totalAds)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Active Advertisers</span>
                <span class="metric-value font-mono">${formatNumber(totalAdvertisers)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Impressions</span>
                <span class="metric-value font-mono">${formatNumber(totalImpressions)}</span>
              </div>
              <div class="metric-row metric-status-row">
                <span class="metric-label">Archive Health</span>
                <span class="metric-status-badge"><span class="status-indicator"></span> Operational</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Bottom Bar -->
        <div class="footer-bottom-bar">
          <div class="footer-bottom-legal">
            <p class="footer-disclaimer-text">
              <strong>Independent Notice:</strong> ChatGPT Ads Library is an independent research project. It is not affiliated, associated, authorized, endorsed by, or in any way officially connected with OpenAI, Inc., ChatGPT, or any of their subsidiaries.
            </p>
            <p class="footer-copyright-text">
              &copy; ${new Date().getFullYear()} ChatGPT Ads Library. Open Transparency Archive.
            </p>
          </div>
          <div class="footer-bottom-actions">
            <button type="button" class="back-to-top-btn" onclick="scrollToTop()" aria-label="Scroll back to top" title="Back to top">
              <span>Back to Top</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- Light / Dark Theme Detector (Prevent FOUC) -->
  <script>
    (function() {
      try {
        var t = localStorage.getItem('chatgpt_ads_theme');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (t === 'light' || (!t && !prefersDark)) {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }
      } catch (e) {}
    })();
  </script>

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

  <!-- Client Interaction Script (Theme Switcher, Mobile Navigation, Scroll) -->
  <script>
    function toggleTheme() {
      var html = document.documentElement;
      var isDark = html.classList.contains('dark');
      if (isDark) {
        html.classList.remove('dark');
        html.classList.add('light');
        try { localStorage.setItem('chatgpt_ads_theme', 'light'); } catch(e){}
      } else {
        html.classList.add('dark');
        html.classList.remove('light');
        try { localStorage.setItem('chatgpt_ads_theme', 'dark'); } catch(e){}
      }
    }
    function toggleMobileMenu() {
      var nav = document.getElementById('mobile-menu');
      var btn = document.getElementById('mobile-menu-btn');
      if (nav) {
        var isOpen = nav.classList.toggle('open');
        if (btn) {
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      }
    }
    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  </script>
</body>
</html>`;
}

