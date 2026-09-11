import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const siteDir = join(root, 'site');

mkdirSync(siteDir, { recursive: true });

const ADS = JSON.parse(readFileSync(join(root, 'data', 'ads.json'), 'utf8'));
const ADVERTISERS = JSON.parse(readFileSync(join(root, 'data', 'advertisers.json'), 'utf8'));

// Sort ads by date DESC, then impressions DESC
ADS.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate) || b.impressions - a.impressions);

// Sort advertisers by adCount DESC
ADVERTISERS.sort((a, b) => b.adCount - a.adCount || a.name.localeCompare(b.name));

// Compute Stats
const totalAds = ADS.length;
const totalAdvertisers = ADVERTISERS.length;
let totalImpressions = 0;
let minDate = ADS[0]?.publishedDate;
let maxDate = ADS[0]?.publishedDate;

for (const ad of ADS) {
  totalImpressions += Number(ad.impressions || 0);
  if (ad.publishedDate < minDate) minDate = ad.publishedDate;
  if (ad.publishedDate > maxDate) maxDate = ad.publishedDate;
}

const PAGE_SIZE = 24;
const totalAdPages = Math.ceil(totalAds / PAGE_SIZE);
const page1Ads = ADS.slice(0, PAGE_SIZE);

const totalAdvPages = Math.ceil(totalAdvertisers / PAGE_SIZE);
const page1Advertisers = ADVERTISERS.slice(0, PAGE_SIZE);

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  const n = Number(num);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-US');
}

function formatDate(dateStr) {
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

function getInitials(name) {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderAdvertiserAvatar(name, logoUrl, size = 'sm') {
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

function renderAdCard(ad) {
  const detailUrl = `/ads/${encodeURIComponent(ad.id)}`;
  const advertiserUrl = `/advertisers/${encodeURIComponent(ad.advertiserSlug)}`;

  return `
    <article class="ad-card" data-ad-id="${escapeHtml(ad.id)}">
      <div class="ad-card-header">
        <a href="${advertiserUrl}" class="ad-advertiser-link" title="View all ads by ${escapeHtml(ad.advertiserName)}">
          ${renderAdvertiserAvatar(ad.advertiserName, ad.advertiserLogo, 'sm')}
          <div class="ad-advertiser-info">
            <span class="ad-advertiser-name">${escapeHtml(ad.advertiserName)}</span>
            <span class="ad-domain">${escapeHtml(ad.websiteDomain || '')}</span>
          </div>
        </a>
        <span class="ad-date-badge" title="Published date">${formatDate(ad.publishedDate)}</span>
      </div>

      ${ad.mediaUrl ? `
        <div class="ad-media-wrapper">
          <a href="${detailUrl}" class="ad-media-link" aria-label="View ad details for ${escapeHtml(ad.copy || ad.advertiserName)}">
            <img src="${escapeHtml(ad.mediaUrl)}" alt="${escapeHtml(ad.copy || ad.advertiserName)}" class="ad-media-img" loading="lazy" />
          </a>
        </div>
      ` : ''}

      <div class="ad-card-body">
        <h3 class="ad-copy-text"><a href="${detailUrl}">${escapeHtml(ad.copy || '')}</a></h3>
        ${ad.description ? `
          <p class="ad-description-text">${escapeHtml(ad.description)}</p>
        ` : ''}
      </div>

      <div class="ad-card-footer">
        <div class="ad-impressions-badge" title="Estimated ad impressions">
          <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>${formatNumber(ad.impressions)} impressions</span>
        </div>

        <div class="ad-actions">
          <button type="button" class="btn-icon copy-ad-btn" data-ad-id="${escapeHtml(ad.id)}" title="Copy link to this ad" aria-label="Copy link to ad">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <a href="${detailUrl}" class="btn btn-sm btn-primary">Details</a>
        </div>
      </div>
    </article>
  `;
}

function renderHeader(active = 'home') {
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

        <div class="header-actions">
          <button type="button" class="theme-toggle-btn" aria-label="Toggle Theme">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle navigation menu">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="mobile-nav" id="mobile-nav">
        <div class="container mobile-nav-inner">
          <a href="/" class="mobile-nav-link ${active === 'home' ? 'active' : ''}">Ads</a>
          <a href="/advertisers" class="mobile-nav-link ${active === 'advertisers' ? 'active' : ''}">Advertisers</a>
          <a href="/about" class="mobile-nav-link ${active === 'about' ? 'active' : ''}">About</a>
        </div>
      </div>
    </header>
  `;
}

function renderFooter() {
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
            <div class="footer-stats-box" id="footer-stats-box">
              <div class="stat-mini-row">
                <span class="stat-mini-label">Indexed Ads</span>
                <span class="stat-mini-val" id="footer-stat-ads">${formatNumber(totalAds)}</span>
              </div>
              <div class="stat-mini-row">
                <span class="stat-mini-label">Active Advertisers</span>
                <span class="stat-mini-val" id="footer-stat-adv">${formatNumber(totalAdvertisers)}</span>
              </div>
              <div class="stat-mini-row">
                <span class="stat-mini-label">Total Impressions</span>
                <span class="stat-mini-val" id="footer-stat-imp">${formatNumber(totalImpressions)}</span>
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

// ── Generate JSON-LD Schemas for Home ─────────────────────────────────────
const firstAdImage = page1Ads[0]?.mediaUrl || 'https://chatgpt-ads-library.com/og-image.jpg';

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://chatgpt-ads-library.com/#website',
    url: 'https://chatgpt-ads-library.com',
    name: 'ChatGPT Ads Library',
    description: 'An independent, searchable archive of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions.',
    author: {
      '@type': 'Organization',
      name: 'ChatGPT Ads Library',
      url: 'https://chatgpt-ads-library.com',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://chatgpt-ads-library.com/?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ChatGPT Ads Library',
    url: 'https://chatgpt-ads-library.com',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://chatgpt-ads-library.com/#webpage',
    url: 'https://chatgpt-ads-library.com/',
    name: 'ChatGPT Ads Library — Browse & Search Ads on ChatGPT',
    description: 'An independent, searchable archive of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions.',
    isPartOf: {
      '@id': 'https://chatgpt-ads-library.com/#website',
    },
    dateModified: maxDate,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.hero-description'],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://chatgpt-ads-library.com/#dataset',
    name: 'ChatGPT Ads Library — Ad Archive',
    description: 'A searchable archive of advertisements running across ChatGPT, including ad creative, advertiser details, impression counts, and publication dates.',
    url: 'https://chatgpt-ads-library.com',
    creator: {
      '@type': 'Organization',
      name: 'ChatGPT Ads Library',
      url: 'https://chatgpt-ads-library.com',
    },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    size: `${totalAds} ads from ${totalAdvertisers} advertisers`,
    dateModified: maxDate,
    keywords: [
      'ChatGPT ads',
      'AI advertising',
      'ad transparency',
      'OpenAI ads',
      'digital advertising',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: page1Ads.map((ad, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: ad.copy,
      url: `https://chatgpt-ads-library.com/ads/${ad.id}`,
      image: ad.mediaUrl,
      description: ad.description,
    })),
  },
];

// ── 1. Generate site/index.html ───────────────────────────────────────────
const indexHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChatGPT Ads Library — Browse &amp; Search Ads on ChatGPT</title>
  <meta name="description" content="An independent, searchable archive of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions." />
  <meta name="keywords" content="ChatGPT ads, AI advertising, ad transparency, OpenAI ads, digital advertising" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <link rel="canonical" href="https://chatgpt-ads-library.com/" />

  <!-- Open Graph -->
  <meta property="og:site_name" content="ChatGPT Ads Library" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="ChatGPT Ads Library — Browse &amp; Search Ads on ChatGPT" />
  <meta property="og:description" content="An independent, searchable archive of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions." />
  <meta property="og:url" content="https://chatgpt-ads-library.com/" />
  <meta property="og:image" content="${escapeHtml(firstAdImage)}" />
  <meta property="og:image:alt" content="ChatGPT Ads Library — Browse &amp; Search Ads on ChatGPT" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="ChatGPT Ads Library — Browse &amp; Search Ads on ChatGPT" />
  <meta name="twitter:description" content="An independent, searchable archive of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions." />
  <meta name="twitter:image" content="${escapeHtml(firstAdImage)}" />

  <!-- Favicons & Manifest -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />

  <!-- Structured Data JSON-LD -->
${structuredData.map(s => `  <script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n  </script>`).join('\n')}
</head>
<body class="bg-surface text-main antialiased min-h-screen flex flex-col">
  <!-- Dynamic Header Root -->
  <div id="header-root">
    ${renderHeader('home')}
  </div>

  <!-- Main Content -->
  <main class="main-content flex-1">
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
            <span class="stat-number" id="hero-stat-ads">${formatNumber(totalAds)}</span>
            <span class="stat-title">Indexed Ads</span>
          </div>
          <div class="hero-stat-card">
            <span class="stat-number" id="hero-stat-adv">${formatNumber(totalAdvertisers)}</span>
            <span class="stat-title">Active Advertisers</span>
          </div>
          <div class="hero-stat-card">
            <span class="stat-number" id="hero-stat-imp">${formatNumber(totalImpressions)}</span>
            <span class="stat-title">Estimated Impressions</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Search & Filter Controls -->
    <section class="browse-section">
      <div class="container">
        <div class="search-filter-bar">
          <div class="search-box-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              id="search-input"
              class="search-input"
              placeholder="Search by keyword, advertiser name, domain, or ad copy..."
              autocomplete="off"
            />
          </div>

          <div class="filter-controls-group">
            <select id="advertiser-select" class="form-select filter-select" aria-label="Filter by advertiser">
              <option value="">All Advertisers</option>
              ${ADVERTISERS.slice(0, 50).map(a => `<option value="${escapeHtml(a.slug)}">${escapeHtml(a.name)} (${a.adCount})</option>`).join('')}
            </select>

            <select id="sort-select" class="form-select filter-select" aria-label="Sort ads">
              <option value="date_desc" selected>Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="impressions_desc">Highest Impressions</option>
              <option value="impressions_asc">Lowest Impressions</option>
            </select>

            <button type="button" class="btn btn-secondary filter-toggle-btn" id="toggle-filters-btn">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span>More Filters</span>
            </button>
          </div>
        </div>

        <!-- Collapsible Filter Drawer -->
        <div class="filter-drawer" id="filter-drawer">
          <div class="drawer-inner">
            <div class="drawer-field">
              <label for="min-impressions-input" class="form-label">Minimum Impressions</label>
              <input
                type="number"
                id="min-impressions-input"
                class="form-input"
                placeholder="e.g. 50000"
                min="0"
                step="1000"
              />
            </div>
          </div>
        </div>

        <!-- Active Filter Badges -->
        <div id="active-filters" class="active-filters-container"></div>

        <!-- Results Header -->
        <div class="results-header">
          <div class="results-count" id="results-count">
            Showing <strong>${page1Ads.length}</strong> of <strong>${formatNumber(totalAds)}</strong> ads
          </div>
        </div>

        <!-- Ads Grid -->
        <div class="ads-grid" id="ads-grid">
          ${page1Ads.map(ad => renderAdCard(ad)).join('')}
        </div>

        <!-- Pagination -->
        <div id="pagination-root" class="pagination-root">
          <div class="pagination-container" role="navigation" aria-label="Pagination">
            <button type="button" class="pagination-btn pagination-prev" disabled data-page="0" aria-label="Previous page">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span>Prev</span>
            </button>

            <div class="pagination-pages">
              <a href="/" class="pagination-page-btn active" data-page="1" aria-label="Page 1" aria-current="page">1</a>
              <a href="/?page=2" class="pagination-page-btn" data-page="2" aria-label="Page 2">2</a>
              <span class="pagination-dots">&hellip;</span>
              <a href="/?page=${totalAdPages}" class="pagination-page-btn" data-page="${totalAdPages}" aria-label="Page ${totalAdPages}">${totalAdPages}</a>
            </div>

            <a href="/?page=2" class="pagination-btn pagination-next" data-page="2" aria-label="Next page">
              <span>Next</span>
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Dynamic Footer Root -->
  <div id="footer-root">
    ${renderFooter()}
  </div>

  <!-- Application Engine -->
  <script src="/app.js"></script>
</body>
</html>
`;

writeFileSync(join(siteDir, 'index.html'), indexHtml);
console.log(`Generated ${join(siteDir, 'index.html')}`);

// ── 2. Generate site/advertisers.html ──────────────────────────────────────
const advertisersHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Advertisers Directory — ChatGPT Ads Library</title>
  <meta name="description" content="Explore verified brands, organizations, and sponsors indexed in the ChatGPT Ads Library transparency archive." />
  <meta name="keywords" content="ChatGPT advertisers, AI ad sponsors, commercial brands ChatGPT" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <link rel="canonical" href="https://chatgpt-ads-library.com/advertisers" />

  <!-- Open Graph -->
  <meta property="og:site_name" content="ChatGPT Ads Library" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Advertisers Directory — ChatGPT Ads Library" />
  <meta property="og:description" content="Explore verified brands, organizations, and sponsors indexed in the ChatGPT Ads Library transparency archive." />
  <meta property="og:url" content="https://chatgpt-ads-library.com/advertisers" />
  <meta property="og:image" content="${escapeHtml(firstAdImage)}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Advertisers Directory — ChatGPT Ads Library" />
  <meta name="twitter:description" content="Explore verified brands, organizations, and sponsors indexed in the ChatGPT Ads Library transparency archive." />
  <meta name="twitter:image" content="${escapeHtml(firstAdImage)}" />

  <!-- Favicons & Manifest -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body class="bg-surface text-main antialiased min-h-screen flex flex-col">
  <!-- Dynamic Header Root -->
  <div id="header-root">
    ${renderHeader('advertisers')}
  </div>

  <!-- Main Content -->
  <main class="main-content flex-1">
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
        <div class="search-filter-bar">
          <div class="search-box-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              id="adv-search-input"
              class="search-input"
              placeholder="Search advertisers by name or domain..."
              autocomplete="off"
            />
          </div>

          <div class="filter-controls-group">
            <select id="adv-sort-select" class="form-select filter-select" aria-label="Sort advertisers">
              <option value="ad_count_desc" selected>Most Ads</option>
              <option value="impressions_desc">Highest Impressions</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        <div class="results-header">
          <div class="results-count" id="adv-results-count">
            Showing <strong>${page1Advertisers.length}</strong> of <strong>${formatNumber(totalAdvertisers)}</strong> advertisers
          </div>
        </div>

        <!-- Advertisers Grid -->
        <div class="advertisers-grid" id="advertisers-grid">
          ${page1Advertisers.map(adv => `
            <a href="/advertisers/${encodeURIComponent(adv.slug)}" class="advertiser-card">
              <div class="adv-card-header">
                ${renderAdvertiserAvatar(adv.name, adv.logo, 'lg')}
                <div class="adv-card-title-group">
                  <h3 class="adv-card-name">${escapeHtml(adv.name)}</h3>
                  <span class="adv-card-domain">${escapeHtml(adv.websiteDomain || '')}</span>
                </div>
              </div>

              <div class="adv-stats-row">
                <div class="adv-stat-pill">
                  <span class="adv-stat-val">${formatNumber(adv.adCount)}</span>
                  <span class="adv-stat-label">Total Ads</span>
                </div>
                <div class="adv-stat-pill">
                  <span class="adv-stat-val">${formatNumber(adv.totalImpressions)}</span>
                  <span class="adv-stat-label">Impressions</span>
                </div>
              </div>

              <div class="adv-card-footer">
                <span class="adv-activity">Active since ${formatDate(adv.firstSeen)}</span>
                <span class="adv-link-label">View Ads &rarr;</span>
              </div>
            </a>
          `).join('')}
        </div>

        <!-- Pagination -->
        <div id="pagination-root" class="pagination-root">
          <div class="pagination-container" role="navigation" aria-label="Pagination">
            <button type="button" class="pagination-btn pagination-prev" disabled data-page="0" aria-label="Previous page">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span>Prev</span>
            </button>

            <div class="pagination-pages">
              <a href="/advertisers" class="pagination-page-btn active" data-page="1" aria-label="Page 1" aria-current="page">1</a>
              <a href="/advertisers?page=2" class="pagination-page-btn" data-page="2" aria-label="Page 2">2</a>
              <span class="pagination-dots">&hellip;</span>
              <a href="/advertisers?page=${totalAdvPages}" class="pagination-page-btn" data-page="${totalAdvPages}" aria-label="Page ${totalAdvPages}">${totalAdvPages}</a>
            </div>

            <a href="/advertisers?page=2" class="pagination-btn pagination-next" data-page="2" aria-label="Next page">
              <span>Next</span>
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Dynamic Footer Root -->
  <div id="footer-root">
    ${renderFooter()}
  </div>

  <!-- Application Engine -->
  <script src="/app.js"></script>
</body>
</html>
`;

writeFileSync(join(siteDir, 'advertisers.html'), advertisersHtml);
console.log(`Generated ${join(siteDir, 'advertisers.html')}`);

// ── 3. Generate site/about.html ────────────────────────────────────────────
const aboutHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>About &amp; Methodology — ChatGPT Ads Library</title>
  <meta name="description" content="Learn how ChatGPT Ads Library indexes, tracks, and analyzes sponsored placements in AI conversational responses." />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <link rel="canonical" href="https://chatgpt-ads-library.com/about" />

  <!-- Open Graph -->
  <meta property="og:site_name" content="ChatGPT Ads Library" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="About &amp; Methodology — ChatGPT Ads Library" />
  <meta property="og:description" content="Transparency documentation and FAQ for the ChatGPT Ads Archive." />
  <meta property="og:url" content="https://chatgpt-ads-library.com/about" />
  <meta property="og:image" content="${escapeHtml(firstAdImage)}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="About &amp; Methodology — ChatGPT Ads Library" />
  <meta name="twitter:description" content="Transparency documentation and FAQ for the ChatGPT Ads Archive." />
  <meta name="twitter:image" content="${escapeHtml(firstAdImage)}" />

  <!-- Favicons & Manifest -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body class="bg-surface text-main antialiased min-h-screen flex flex-col">
  <!-- Dynamic Header Root -->
  <div id="header-root">
    ${renderHeader('about')}
  </div>

  <!-- Main Content -->
  <main class="main-content flex-1">
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Mission &amp; Transparency</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">About ChatGPT Ads Library</h1>
        <p class="page-subtitle animate-fade-in">
          Providing independent transparency, historical archiving, and analytical insights into the commercialization and advertising models of conversational AI.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-4xl mx-auto">
      <!-- Mission Cards -->
      <div class="about-grid">
        <div class="card p-6">
          <div class="card-icon-box text-emerald">
            <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3 class="card-title mt-4">Public Transparency</h3>
          <p class="card-text mt-2 text-muted">
            As Large Language Models become primary discovery tools, understanding how commercial content and sponsored recommendations are woven into conversations is critical for users and researchers.
          </p>
        </div>

        <div class="card p-6">
          <div class="card-icon-box text-emerald">
            <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h3 class="card-title mt-4">Independent Archive</h3>
          <p class="card-text mt-2 text-muted">
            We preserve immutable snapshots of ad copy, accompanying visual creative assets, landing destinations, and timing to create an open public historical record.
          </p>
        </div>

        <div class="card p-6">
          <div class="card-icon-box text-emerald">
            <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <h3 class="card-title mt-4">Impression Estimation</h3>
          <p class="card-text mt-2 text-muted">
            Our algorithmic models analyze placement frequency, session sampling, and query volume to provide estimated visibility benchmarks for competitive intelligence.
          </p>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="faq-section mt-12" id="faq">
        <h2 class="section-title text-center">Frequently Asked Questions</h2>
        <p class="section-subtitle text-center text-muted">Common questions about data collection and coverage.</p>

        <div class="faq-list mt-6">
          <div class="faq-item">
            <button type="button" class="faq-question" aria-expanded="false">
              <span>How does ChatGPT Ads Library collect ad data?</span>
              <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="faq-answer">
              <p>Data is captured through continuous sampling of sponsored responses, user contribution submissions, and automated crawler indexing that identifies commercial disclosures, brand badges, and sponsored recommendation metadata in conversational responses.</p>
            </div>
          </div>

          <div class="faq-item">
            <button type="button" class="faq-question" aria-expanded="false">
              <span>Is this website officially associated with OpenAI?</span>
              <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="faq-answer">
              <p>No. ChatGPT Ads Library is an entirely independent research archive. It is not affiliated with, endorsed by, funded by, or sponsored by OpenAI Inc. or any of the advertisers listed in this library.</p>
            </div>
          </div>

          <div class="faq-item">
            <button type="button" class="faq-question" aria-expanded="false">
              <span>How are impression numbers calculated?</span>
              <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="faq-answer">
              <p>Impressions are estimated based on observed appearance frequency across our standardized sampling prompts, aggregate category search volumes, and statistical modeling. They represent best-effort estimates for comparative benchmarking.</p>
            </div>
          </div>

          <div class="faq-item">
            <button type="button" class="faq-question" aria-expanded="false">
              <span>How can I report an unlisted ad or incorrect data?</span>
              <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="faq-answer">
              <p>If you encounter a sponsored placement not currently in our archive or need to request a metadata correction, please open an issue on our GitHub repository with the ad URL, screenshot, and date observed.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Legal Disclaimer Callout -->
      <div class="disclaimer-callout mt-12">
        <h4 class="disclaimer-title">Legal &amp; Trademark Notice</h4>
        <p class="disclaimer-text">
          "ChatGPT", "OpenAI", and associated logos are registered trademarks of OpenAI Inc. All advertiser names, logos, brand assets, and creative copies displayed on this site are the property of their respective copyright and trademark owners. They are displayed here under Fair Use for research, criticism, news reporting, and public transparency purposes.
        </p>
      </div>
    </section>
  </main>

  <!-- Dynamic Footer Root -->
  <div id="footer-root">
    ${renderFooter()}
  </div>

  <!-- Application Engine -->
  <script src="/app.js"></script>
</body>
</html>
`;

writeFileSync(join(siteDir, 'about.html'), aboutHtml);
console.log(`Generated ${join(siteDir, 'about.html')}`);
