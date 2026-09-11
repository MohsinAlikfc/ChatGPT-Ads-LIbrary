/* ═══════════════════════════════════════════════════════════════════════════
   ChatGPT Ads Library — Vanilla JS Application Engine
   Zero-framework, high-performance, dynamic client-side application.
   ═══════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ── Config ───────────────────────────────────────────────────────────────
  // Automatically detects local worker at :8787 if running static files on separate port
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const defaultApi = (isLocalDev && window.location.port && window.location.port !== '8787')
    ? 'http://127.0.0.1:8787'
    : '/api';
  const API_BASE = window.API_BASE_URL || defaultApi;

  // ── Utility Functions ────────────────────────────────────────────────────
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

  function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

  function debounce(fn, delayMs = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delayMs);
    };
  }

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || '';
  }

  function getAdIdFromUrl() {
    const queryId = getQueryParam('id');
    if (queryId) return queryId;
    const path = window.location.pathname;
    const match = path.match(/\/ads\/([^/?#]+)/);
    if (match) return decodeURIComponent(match[1]);
    return '';
  }

  function getAdvertiserSlugFromUrl() {
    const querySlug = getQueryParam('slug') || getQueryParam('id');
    if (querySlug) return querySlug;
    const path = window.location.pathname;
    const match = path.match(/\/(?:advertiser|advertisers)\/([^/?#]+)/);
    if (match && !match[1].endsWith('.html') && match[1] !== 'advertisers') {
      return decodeURIComponent(match[1]);
    }
    return '';
  }

  function setQueryParams(newParams, replace = false) {
    const url = new URL(window.location.href);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v == null || v === '' || (k === 'page' && v === 1)) {
        url.searchParams.delete(k);
      } else {
        url.searchParams.set(k, String(v));
      }
    });
    if (replace) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
  }

  // ── Toast Notification System ────────────────────────────────────────────
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    toast.innerHTML = `
      <div class="toast-icon">
        ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </div>
      <div class="toast-message">${escapeHtml(message)}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ── Theme Management ─────────────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('chatgpt_ads_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;

    document.documentElement.classList.toggle('dark', isDark);
    updateThemeToggleBtn(isDark);
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('chatgpt_ads_theme', isDark ? 'dark' : 'light');
    updateThemeToggleBtn(isDark);
  }

  function updateThemeToggleBtn(isDark) {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.innerHTML = isDark
        ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    });
  }

  // ── API Client ───────────────────────────────────────────────────────────
  async function fetchJSON(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.error(`API Error on ${url}:`, err);
      throw err;
    }
  }

  // ── Shared UI Components ─────────────────────────────────────────────────
  function renderHeader(activePage = 'home') {
    const nav = [
      { id: 'home', label: 'Explore Ads', href: '/index.html' },
      { id: 'advertisers', label: 'Advertisers', href: '/advertisers.html' },
      { id: 'about', label: 'About & Methodology', href: '/about.html' },
    ];

    return `
      <header class="site-header">
        <div class="header-container container">
          <a href="/index.html" class="brand-logo" aria-label="ChatGPT Ads Library Home">
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
            ${nav.map(item => `
              <a href="${item.href}" class="nav-link ${activePage === item.id ? 'active' : ''}">
                ${item.label}
              </a>
            `).join('')}
          </nav>

          <div class="header-actions">
            <button type="button" class="theme-toggle-btn" aria-label="Toggle Theme">
              <!-- icon inserted by initTheme -->
            </button>
            <button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle navigation menu">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="mobile-nav" id="mobile-nav">
          <div class="container mobile-nav-inner">
            ${nav.map(item => `
              <a href="${item.href}" class="mobile-nav-link ${activePage === item.id ? 'active' : ''}">
                ${item.label}
              </a>
            `).join('')}
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
                An open, independent public archive tracking sponsored content, ad copy, and advertiser transparency across ChatGPT.
              </p>
            </div>

            <div class="footer-links-group">
              <h4 class="footer-heading">Navigation</h4>
              <ul class="footer-links-list">
                <li><a href="/index.html">Explore Ads</a></li>
                <li><a href="/advertisers.html">All Advertisers</a></li>
                <li><a href="/about.html">About Project</a></li>
                <li><a href="/about.html#faq">Methodology & FAQ</a></li>
              </ul>
            </div>

            <div class="footer-links-group">
              <h4 class="footer-heading">Archive Metrics</h4>
              <div class="footer-stats-box" id="footer-stats-box">
                <div class="stat-mini-row">
                  <span class="stat-mini-label">Indexed Ads</span>
                  <span class="stat-mini-val" id="footer-stat-ads">—</span>
                </div>
                <div class="stat-mini-row">
                  <span class="stat-mini-label">Active Advertisers</span>
                  <span class="stat-mini-val" id="footer-stat-adv">—</span>
                </div>
                <div class="stat-mini-row">
                  <span class="stat-mini-label">Total Impressions</span>
                  <span class="stat-mini-val" id="footer-stat-imp">—</span>
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

  function renderPagination(page, totalPages, totalItems) {
    if (totalPages <= 1) return '';

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
        <button type="button" class="pagination-btn pagination-prev" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}" aria-label="Previous page">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Prev</span>
        </button>

        <div class="pagination-pages">
          ${rangeWithDots.map(item => {
            if (item === '...') {
              return `<span class="pagination-dots">&hellip;</span>`;
            }
            return `
              <button type="button" class="pagination-page-btn ${item === page ? 'active' : ''}" data-page="${item}" aria-label="Page ${item}" aria-current="${item === page ? 'page' : 'false'}">
                ${item}
              </button>
            `;
          }).join('')}
        </div>

        <button type="button" class="pagination-btn pagination-next" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}" aria-label="Next page">
          <span>Next</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    `;
  }

  function renderEmptyState(title = 'No Ads Found', desc = 'Try clearing your search query or adjusting your filters.') {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <h3 class="empty-state-title">${escapeHtml(title)}</h3>
        <p class="empty-state-desc">${escapeHtml(desc)}</p>
        <button type="button" class="btn btn-secondary" id="reset-filters-btn">Reset All Filters</button>
      </div>
    `;
  }

  function renderLoadingSkeleton(count = 6) {
    return Array.from({ length: count }).map(() => `
      <div class="ad-card-skeleton">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-subtitle"></div>
          </div>
        </div>
        <div class="skeleton-media"></div>
        <div class="skeleton-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width: 80%;"></div>
        </div>
        <div class="skeleton-footer">
          <div class="skeleton-badge"></div>
          <div class="skeleton-btn"></div>
        </div>
      </div>
    `).join('');
  }

  // ── Global Stats Loader ──────────────────────────────────────────────────
  async function loadGlobalStats() {
    try {
      const stats = await fetchJSON('/stats');
      const adsCount = document.getElementById('hero-stat-ads');
      const advCount = document.getElementById('hero-stat-adv');
      const impCount = document.getElementById('hero-stat-imp');

      if (adsCount) adsCount.textContent = formatNumber(stats.totalAds);
      if (advCount) advCount.textContent = formatNumber(stats.totalAdvertisers);
      if (impCount) impCount.textContent = formatNumber(stats.totalImpressions);

      const footerAds = document.getElementById('footer-stat-ads');
      const footerAdv = document.getElementById('footer-stat-adv');
      const footerImp = document.getElementById('footer-stat-imp');

      if (footerAds) footerAds.textContent = formatNumber(stats.totalAds);
      if (footerAdv) footerAdv.textContent = formatNumber(stats.totalAdvertisers);
      if (footerImp) footerImp.textContent = formatNumber(stats.totalImpressions);

      return stats;
    } catch (e) {
      console.warn('Failed to load global stats:', e);
      return null;
    }
  }

  // ── Copy Link Helper ─────────────────────────────────────────────────────
  function setupCopyHandlers(root = document) {
    root.querySelectorAll('.copy-ad-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const adId = btn.getAttribute('data-ad-id');
        const url = `${window.location.origin}/ad.html?id=${encodeURIComponent(adId)}`;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Ad link copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Failed to copy link', 'error');
        });
      };
    });
  }

  // ── Setup Mobile Menu ────────────────────────────────────────────────────
  function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-nav');
    if (btn && menu) {
      btn.onclick = () => {
        const isOpen = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1. Home Page ─────────────────────────────────────────────────────────
  async function initHomePage() {
    const headerEl = document.getElementById('header-root');
    const footerEl = document.getElementById('footer-root');
    if (headerEl) headerEl.innerHTML = renderHeader('home');
    if (footerEl) footerEl.innerHTML = renderFooter();

    initTheme();
    setupMobileMenu();
    document.querySelector('.theme-toggle-btn')?.addEventListener('click', toggleTheme);

    loadGlobalStats();

    // Elements
    const searchInput = document.getElementById('search-input');
    const advertiserSelect = document.getElementById('advertiser-select');
    const sortSelect = document.getElementById('sort-select');
    const minImpInput = document.getElementById('min-impressions-input');
    const filterToggleBtn = document.getElementById('toggle-filters-btn');
    const filterPanel = document.getElementById('filter-drawer');
    const adsGrid = document.getElementById('ads-grid');
    const paginationRoot = document.getElementById('pagination-root');
    const resultsCountEl = document.getElementById('results-count');
    const activeFiltersEl = document.getElementById('active-filters');

    // Populate advertisers in filter dropdown
    try {
      const advData = await fetchJSON('/advertisers?limit=100&sort=name_asc');
      if (advData && advData.advertisers && advertiserSelect) {
        const currentAdv = getQueryParam('advertiser');
        advertiserSelect.innerHTML = `
          <option value="">All Advertisers</option>
          ${advData.advertisers.map(a => `
            <option value="${escapeHtml(a.slug)}" ${currentAdv === a.slug ? 'selected' : ''}>
              ${escapeHtml(a.name)} (${a.adCount})
            </option>
          `).join('')}
        `;
      }
    } catch (e) {
      console.warn('Failed to load advertisers for select:', e);
    }

    // State
    const state = {
      q: getQueryParam('q'),
      advertiser: getQueryParam('advertiser'),
      sort: getQueryParam('sort') || 'date_desc',
      min_impressions: getQueryParam('min_impressions'),
      page: Number(getQueryParam('page')) || 1,
      limit: 24,
    };

    // Sync input controls with initial state
    if (searchInput && state.q) searchInput.value = state.q;
    if (sortSelect && state.sort) sortSelect.value = state.sort;
    if (minImpInput && state.min_impressions) minImpInput.value = state.min_impressions;

    // Filter drawer toggle
    if (filterToggleBtn && filterPanel) {
      filterToggleBtn.onclick = () => {
        filterPanel.classList.toggle('open');
      };
    }

    // Helper to bind pagination clicks
    function bindPaginationHandlers() {
      if (paginationRoot) {
        paginationRoot.querySelectorAll('[data-page]').forEach(btn => {
          btn.onclick = (e) => {
            e.preventDefault();
            const targetPage = Number(btn.getAttribute('data-page'));
            if (targetPage && targetPage !== state.page) {
              state.page = targetPage;
              fetchAndRenderAds();
              adsGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          };
        });
      }
    }

    async function fetchAndRenderAds() {
      if (!adsGrid) return;
      adsGrid.innerHTML = renderLoadingSkeleton(6);
      if (resultsCountEl) resultsCountEl.textContent = 'Searching ads...';

      const params = new URLSearchParams();
      if (state.q) params.set('q', state.q);
      if (state.advertiser) params.set('advertiser', state.advertiser);
      if (state.sort) params.set('sort', state.sort);
      if (state.min_impressions) params.set('min_impressions', state.min_impressions);
      if (state.page > 1) params.set('page', String(state.page));
      params.set('limit', String(state.limit));

      setQueryParams({
        q: state.q,
        advertiser: state.advertiser,
        sort: state.sort === 'date_desc' ? '' : state.sort,
        min_impressions: state.min_impressions,
        page: state.page,
      }, true);

      renderActiveFilters();

      try {
        const data = await fetchJSON(`/ads?${params.toString()}`);
        const ads = data.ads || [];
        const total = data.total || 0;
        const totalPages = data.totalPages || 1;

        if (resultsCountEl) {
          resultsCountEl.innerHTML = `Showing <strong>${ads.length}</strong> of <strong>${formatNumber(total)}</strong> ads`;
        }

        if (ads.length === 0) {
          adsGrid.innerHTML = renderEmptyState();
          document.getElementById('reset-filters-btn')?.addEventListener('click', resetAllFilters);
          if (paginationRoot) paginationRoot.innerHTML = '';
          return;
        }

        adsGrid.innerHTML = ads.map(ad => renderAdCard(ad)).join('');
        setupCopyHandlers(adsGrid);
        if (paginationRoot) {
          paginationRoot.innerHTML = renderPagination(state.page, totalPages, total);
          bindPaginationHandlers();
        }
      } catch (err) {
        adsGrid.innerHTML = `
          <div class="error-banner">
            <h3>Unable to load ads</h3>
            <p>${escapeHtml(err.message)}</p>
            <button type="button" class="btn btn-secondary" onclick="location.reload()">Retry</button>
          </div>
        `;
      }
    }

    function renderActiveFilters() {
      if (!activeFiltersEl) return;
      const chips = [];

      if (state.q) {
        chips.push(`
          <span class="filter-chip">
            Query: "${escapeHtml(state.q)}"
            <button type="button" class="chip-remove" data-clear="q" aria-label="Remove search filter">&times;</button>
          </span>
        `);
      }

      if (state.advertiser) {
        chips.push(`
          <span class="filter-chip">
            Advertiser: ${escapeHtml(state.advertiser)}
            <button type="button" class="chip-remove" data-clear="advertiser" aria-label="Remove advertiser filter">&times;</button>
          </span>
        `);
      }

      if (state.min_impressions) {
        chips.push(`
          <span class="filter-chip">
            Min Impressions: ${formatNumber(state.min_impressions)}
            <button type="button" class="chip-remove" data-clear="min_impressions" aria-label="Remove impressions filter">&times;</button>
          </span>
        `);
      }

      if (chips.length > 0) {
        chips.push(`
          <button type="button" class="btn-text-clear" id="clear-all-chips">Clear all</button>
        `);
        activeFiltersEl.innerHTML = `<div class="active-chips-row">${chips.join('')}</div>`;
        activeFiltersEl.querySelectorAll('[data-clear]').forEach(btn => {
          btn.onclick = () => {
            const key = btn.getAttribute('data-clear');
            state[key] = '';
            if (key === 'q' && searchInput) searchInput.value = '';
            if (key === 'advertiser' && advertiserSelect) advertiserSelect.value = '';
            if (key === 'min_impressions' && minImpInput) minImpInput.value = '';
            state.page = 1;
            fetchAndRenderAds();
          };
        });
        document.getElementById('clear-all-chips')?.addEventListener('click', resetAllFilters);
      } else {
        activeFiltersEl.innerHTML = '';
      }
    }

    function resetAllFilters() {
      state.q = '';
      state.advertiser = '';
      state.sort = 'date_desc';
      state.min_impressions = '';
      state.page = 1;

      if (searchInput) searchInput.value = '';
      if (advertiserSelect) advertiserSelect.value = '';
      if (sortSelect) sortSelect.value = 'date_desc';
      if (minImpInput) minImpInput.value = '';

      fetchAndRenderAds();
    }

    // Event listeners
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        state.q = e.target.value.trim();
        state.page = 1;
        fetchAndRenderAds();
      }, 350));
    }

    if (advertiserSelect) {
      advertiserSelect.addEventListener('change', (e) => {
        state.advertiser = e.target.value;
        state.page = 1;
        fetchAndRenderAds();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.page = 1;
        fetchAndRenderAds();
      });
    }

    if (minImpInput) {
      minImpInput.addEventListener('change', (e) => {
        state.min_impressions = e.target.value;
        state.page = 1;
        fetchAndRenderAds();
      });
    }

    // If pre-rendered ads exist and no search/filter params are present, keep them and bind handlers
    const hasActiveFilters = Boolean(
      state.q || state.advertiser || (state.sort && state.sort !== 'date_desc') || state.min_impressions || state.page > 1
    );

    if (!hasActiveFilters && adsGrid && adsGrid.children.length > 0) {
      setupCopyHandlers(adsGrid);
      bindPaginationHandlers();
    } else {
      fetchAndRenderAds();
    }
  }

  // ── 2. Ad Detail Page ────────────────────────────────────────────────────
  async function initAdDetailPage() {
    const headerEl = document.getElementById('header-root');
    const footerEl = document.getElementById('footer-root');
    if (headerEl) headerEl.innerHTML = renderHeader('home');
    if (footerEl) footerEl.innerHTML = renderFooter();

    initTheme();
    setupMobileMenu();
    document.querySelector('.theme-toggle-btn')?.addEventListener('click', toggleTheme);
    loadGlobalStats();

    const adId = getAdIdFromUrl();
    const container = document.getElementById('ad-detail-container');

    if (!adId) {
      if (container) {
        container.innerHTML = `
          <div class="error-banner">
            <h2>No Ad Specified</h2>
            <p>Please provide an ad ID in the URL parameter.</p>
            <a href="/index.html" class="btn btn-primary">Browse All Ads</a>
          </div>
        `;
      }
      return;
    }

    try {
      const data = await fetchJSON(`/ads/${encodeURIComponent(adId)}`);
      const ad = data.ad;
      const relatedAds = data.relatedAds || [];

      document.title = `${ad.advertiserName} Ad (${ad.id}) — ChatGPT Ads Library`;

      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `Sponsored ad by ${ad.advertiserName} on ChatGPT: "${ad.copy ? ad.copy.slice(0, 140) : ''}"`);
      }

      container.innerHTML = `
        <div class="breadcrumb-bar">
          <a href="/index.html">Explore Ads</a>
          <span class="breadcrumb-sep">/</span>
          <a href="/advertiser.html?slug=${encodeURIComponent(ad.advertiserSlug)}">${escapeHtml(ad.advertiserName)}</a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">Ad ${escapeHtml(ad.id)}</span>
        </div>

        <div class="ad-detail-layout">
          <div class="ad-detail-media-col">
            ${ad.mediaUrl ? `
              <div class="ad-detail-media-card">
                <img src="${escapeHtml(ad.mediaUrl)}" alt="Sponsored ad by ${escapeHtml(ad.advertiserName)}" class="detail-full-img" />
                <div class="media-card-actions">
                  <a href="${escapeHtml(ad.mediaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Open Original Image
                  </a>
                </div>
              </div>
            ` : `
              <div class="ad-detail-no-media">
                <p>No media asset was attached to this sponsored result.</p>
              </div>
            `}
          </div>

          <div class="ad-detail-info-col">
            <div class="ad-detail-card">
              <div class="detail-advertiser-header">
                <a href="/advertiser.html?slug=${encodeURIComponent(ad.advertiserSlug)}" class="detail-advertiser-profile">
                  ${renderAdvertiserAvatar(ad.advertiserName, ad.advertiserLogo, 'lg')}
                  <div>
                    <h1 class="detail-advertiser-name">${escapeHtml(ad.advertiserName)}</h1>
                    <span class="detail-advertiser-domain">${escapeHtml(ad.websiteDomain || '')}</span>
                  </div>
                </a>
              </div>

              <div class="detail-section">
                <h3 class="detail-section-label">Ad Copy & Text</h3>
                <div class="detail-copy-box">
                  <p class="detail-copy-content">${escapeHtml(ad.copy || 'No copy text available.')}</p>
                </div>
                ${ad.description ? `
                  <div class="detail-desc-box">
                    <span class="detail-desc-label">Description / Subtext:</span>
                    <p class="detail-desc-content">${escapeHtml(ad.description)}</p>
                  </div>
                ` : ''}
              </div>

              <div class="detail-section">
                <h3 class="detail-section-label">Archive Transparency Data</h3>
                <div class="meta-data-table">
                  <div class="meta-row">
                    <span class="meta-key">Ad Identifier</span>
                    <span class="meta-val font-mono">${escapeHtml(ad.id)}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-key">Published Date</span>
                    <span class="meta-val">${formatDate(ad.publishedDate)}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-key">Est. Impressions</span>
                    <span class="meta-val font-bold text-emerald">${formatNumber(ad.impressions)}</span>
                  </div>
                  ${ad.websiteUrl ? `
                    <div class="meta-row">
                      <span class="meta-key">Landing URL</span>
                      <span class="meta-val">
                        <a href="${escapeHtml(ad.websiteUrl)}" target="_blank" rel="nofollow noopener noreferrer" class="external-link">
                          ${escapeHtml(ad.websiteDomain || ad.websiteUrl)}
                          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      </span>
                    </div>
                  ` : ''}
                  ${ad.advertiserPageUrl ? `
                    <div class="meta-row">
                      <span class="meta-key">Advertiser Page</span>
                      <span class="meta-val">
                        <a href="${escapeHtml(ad.advertiserPageUrl)}" target="_blank" rel="nofollow noopener noreferrer" class="external-link">
                          View Page Profile
                          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      </span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="detail-actions-bar">
                <button type="button" class="btn btn-secondary" id="detail-copy-link-btn">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy Ad Link
                </button>
                <a href="/advertiser.html?slug=${encodeURIComponent(ad.advertiserSlug)}" class="btn btn-primary">
                  All Ads from ${escapeHtml(ad.advertiserName)}
                </a>
              </div>
            </div>
          </div>
        </div>

        ${relatedAds.length > 0 ? `
          <div class="related-ads-section">
            <h2 class="related-heading">More Ads from ${escapeHtml(ad.advertiserName)}</h2>
            <div class="ads-grid">
              ${relatedAds.map(r => renderAdCard(r)).join('')}
            </div>
          </div>
        ` : ''}
      `;

      // Copy ad link button
      document.getElementById('detail-copy-link-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('Ad URL copied to clipboard!', 'success');
        });
      });

      setupCopyHandlers(container);
    } catch (err) {
      if (container) {
        container.innerHTML = `
          <div class="error-banner">
            <h2>Ad Not Found</h2>
            <p>${escapeHtml(err.message)}</p>
            <a href="/index.html" class="btn btn-primary">Back to Explore Ads</a>
          </div>
        `;
      }
    }
  }

  // ── 3. Advertisers List Page ─────────────────────────────────────────────
  async function initAdvertisersPage() {
    const headerEl = document.getElementById('header-root');
    const footerEl = document.getElementById('footer-root');
    if (headerEl) headerEl.innerHTML = renderHeader('advertisers');
    if (footerEl) footerEl.innerHTML = renderFooter();

    initTheme();
    setupMobileMenu();
    document.querySelector('.theme-toggle-btn')?.addEventListener('click', toggleTheme);
    loadGlobalStats();

    const searchInput = document.getElementById('adv-search-input');
    const sortSelect = document.getElementById('adv-sort-select');
    const gridEl = document.getElementById('advertisers-grid');
    const paginationRoot = document.getElementById('pagination-root');
    const countEl = document.getElementById('adv-results-count');

    const state = {
      q: getQueryParam('q'),
      sort: getQueryParam('sort') || 'ad_count_desc',
      page: Number(getQueryParam('page')) || 1,
      limit: 24,
    };

    if (searchInput && state.q) searchInput.value = state.q;
    if (sortSelect && state.sort) sortSelect.value = state.sort;

    async function fetchAndRenderAdvertisers() {
      if (!gridEl) return;
      gridEl.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading advertisers directory...</p>
        </div>
      `;

      const params = new URLSearchParams();
      if (state.q) params.set('q', state.q);
      if (state.sort) params.set('sort', state.sort);
      if (state.page > 1) params.set('page', String(state.page));
      params.set('limit', String(state.limit));

      setQueryParams({
        q: state.q,
        sort: state.sort === 'ad_count_desc' ? '' : state.sort,
        page: state.page,
      }, true);

      try {
        const data = await fetchJSON(`/advertisers?${params.toString()}`);
        const advertisers = data.advertisers || [];
        const total = data.total || 0;
        const totalPages = data.totalPages || 1;

        if (countEl) {
          countEl.innerHTML = `Showing <strong>${advertisers.length}</strong> of <strong>${formatNumber(total)}</strong> advertisers`;
        }

        if (advertisers.length === 0) {
          gridEl.innerHTML = renderEmptyState('No Advertisers Found', 'Try adjusting your search criteria.');
          if (paginationRoot) paginationRoot.innerHTML = '';
          return;
        }

        gridEl.innerHTML = advertisers.map(adv => `
          <a href="/advertiser.html?slug=${encodeURIComponent(adv.slug)}" class="advertiser-card">
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
        `).join('');

        if (paginationRoot) {
          paginationRoot.innerHTML = renderPagination(state.page, totalPages, total);
          bindAdvPaginationHandlers();
        }
      } catch (err) {
        gridEl.innerHTML = `
          <div class="error-banner">
            <h3>Failed to load advertisers</h3>
            <p>${escapeHtml(err.message)}</p>
            <button type="button" class="btn btn-secondary" onclick="location.reload()">Retry</button>
          </div>
        `;
      }
    }

    function bindAdvPaginationHandlers() {
      if (paginationRoot) {
        paginationRoot.querySelectorAll('[data-page]').forEach(btn => {
          btn.onclick = (e) => {
            e.preventDefault();
            const p = Number(btn.getAttribute('data-page'));
            if (p && p !== state.page) {
              state.page = p;
              fetchAndRenderAdvertisers();
              gridEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          };
        });
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        state.q = e.target.value.trim();
        state.page = 1;
        fetchAndRenderAdvertisers();
      }, 350));
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.page = 1;
        fetchAndRenderAdvertisers();
      });
    }

    const hasActiveFilters = Boolean(state.q || (state.sort && state.sort !== 'ad_count_desc') || state.page > 1);
    if (!hasActiveFilters && gridEl && gridEl.children.length > 0) {
      bindAdvPaginationHandlers();
    } else {
      fetchAndRenderAdvertisers();
    }
  }

  // ── 4. Advertiser Detail Page ────────────────────────────────────────────
  async function initAdvertiserDetailPage() {
    const headerEl = document.getElementById('header-root');
    const footerEl = document.getElementById('footer-root');
    if (headerEl) headerEl.innerHTML = renderHeader('advertisers');
    if (footerEl) footerEl.innerHTML = renderFooter();

    initTheme();
    setupMobileMenu();
    document.querySelector('.theme-toggle-btn')?.addEventListener('click', toggleTheme);
    loadGlobalStats();

    const slug = getAdvertiserSlugFromUrl();
    const profileContainer = document.getElementById('advertiser-profile-header');
    const adsGrid = document.getElementById('advertiser-ads-grid');
    const paginationRoot = document.getElementById('pagination-root');
    const sortSelect = document.getElementById('adv-ads-sort');

    if (!slug) {
      if (profileContainer) {
        profileContainer.innerHTML = `
          <div class="error-banner">
            <h2>No Advertiser Selected</h2>
            <a href="/advertisers" class="btn btn-primary">Browse Advertisers</a>
          </div>
        `;
      }
      return;
    }

    const state = {
      sort: getQueryParam('sort') || 'date_desc',
      page: Number(getQueryParam('page')) || 1,
      limit: 24,
    };

    if (sortSelect) sortSelect.value = state.sort;

    async function loadAdvertiserData() {
      try {
        const params = new URLSearchParams();
        params.set('sort', state.sort);
        if (state.page > 1) params.set('page', String(state.page));
        params.set('limit', String(state.limit));

        setQueryParams({
          slug,
          sort: state.sort === 'date_desc' ? '' : state.sort,
          page: state.page,
        }, true);

        const data = await fetchJSON(`/advertisers/${encodeURIComponent(slug)}?${params.toString()}`);
        const adv = data.advertiser;
        const ads = data.ads || [];
        const totalAds = data.totalAds || 0;
        const totalPages = data.totalPages || 1;

        document.title = `${adv.name} Ads Archive — ChatGPT Ads Library`;

        if (profileContainer) {
          profileContainer.innerHTML = `
            <div class="breadcrumb-bar">
              <a href="/">Explore Ads</a>
              <span class="breadcrumb-sep">/</span>
              <a href="/advertisers">Advertisers</a>
              <span class="breadcrumb-sep">/</span>
              <span class="breadcrumb-current">${escapeHtml(adv.name)}</span>
            </div>

            <div class="advertiser-hero-card">
              <div class="adv-hero-left">
                ${renderAdvertiserAvatar(adv.name, adv.logo, 'xl')}
                <div class="adv-hero-titles">
                  <h1 class="adv-hero-name">${escapeHtml(adv.name)}</h1>
                  ${adv.websiteUrl ? `
                    <a href="${escapeHtml(adv.websiteUrl)}" target="_blank" rel="nofollow noopener noreferrer" class="adv-hero-domain">
                      ${escapeHtml(adv.websiteDomain || adv.websiteUrl)}
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  ` : ''}
                </div>
              </div>

              <div class="adv-hero-stats">
                <div class="hero-stat-item">
                  <span class="hero-stat-num">${formatNumber(adv.adCount)}</span>
                  <span class="hero-stat-label">Total Ads</span>
                </div>
                <div class="hero-stat-item">
                  <span class="hero-stat-num">${formatNumber(adv.totalImpressions)}</span>
                  <span class="hero-stat-label">Total Impressions</span>
                </div>
                <div class="hero-stat-item">
                  <span class="hero-stat-num">${formatDate(adv.firstSeen)}</span>
                  <span class="hero-stat-label">First Seen</span>
                </div>
                <div class="hero-stat-item">
                  <span class="hero-stat-num">${formatDate(adv.lastSeen)}</span>
                  <span class="hero-stat-label">Last Seen</span>
                </div>
              </div>
            </div>
          `;
        }

        if (adsGrid) {
          if (ads.length === 0) {
            adsGrid.innerHTML = renderEmptyState('No ads found for this advertiser', '');
            if (paginationRoot) paginationRoot.innerHTML = '';
            return;
          }

          adsGrid.innerHTML = ads.map(a => renderAdCard(a)).join('');
          setupCopyHandlers(adsGrid);

          if (paginationRoot) {
            paginationRoot.innerHTML = renderPagination(state.page, totalPages, totalAds);
            paginationRoot.querySelectorAll('[data-page]').forEach(btn => {
              btn.onclick = () => {
                const p = Number(btn.getAttribute('data-page'));
                if (p && p !== state.page) {
                  state.page = p;
                  loadAdvertiserData();
                  adsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              };
            });
          }
        }
      } catch (err) {
        if (profileContainer) {
          profileContainer.innerHTML = `
            <div class="error-banner">
              <h2>Advertiser Not Found</h2>
              <p>${escapeHtml(err.message)}</p>
              <a href="/advertisers" class="btn btn-primary">Back to Advertisers Directory</a>
            </div>
          `;
        }
      }
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.page = 1;
        loadAdvertiserData();
      });
    }

    loadAdvertiserData();
  }

  // ── 5. About Page ────────────────────────────────────────────────────────
  function initAboutPage() {
    const headerEl = document.getElementById('header-root');
    const footerEl = document.getElementById('footer-root');
    if (headerEl) headerEl.innerHTML = renderHeader('about');
    if (footerEl) footerEl.innerHTML = renderFooter();

    initTheme();
    setupMobileMenu();
    document.querySelector('.theme-toggle-btn')?.addEventListener('click', toggleTheme);
    loadGlobalStats();

    // FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question');
      if (question) {
        question.onclick = () => {
          const isOpen = item.classList.toggle('open');
          question.setAttribute('aria-expanded', String(isOpen));
        };
      }
    });
  }

  // ── 6. 404 Page ──────────────────────────────────────────────────────────
  function init404Page() {
    const headerEl = document.getElementById('header-root');
    const footerEl = document.getElementById('footer-root');
    if (headerEl) headerEl.innerHTML = renderHeader('');
    if (footerEl) footerEl.innerHTML = renderFooter();

    initTheme();
    setupMobileMenu();
    document.querySelector('.theme-toggle-btn')?.addEventListener('click', toggleTheme);
    loadGlobalStats();
  }

  // ── Auto Router ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith('ad.html') || path.startsWith('/ads/') || path === '/ad') {
      initAdDetailPage();
    } else if (path.endsWith('advertiser.html') || /^\/(?:advertiser|advertisers)\/[^/]+$/.test(path)) {
      initAdvertiserDetailPage();
    } else if (path.endsWith('advertisers.html') || path === '/advertisers' || path === '/advertisers/') {
      initAdvertisersPage();
    } else if (path.endsWith('about.html') || path === '/about' || path === '/about/') {
      initAboutPage();
    } else if (path.endsWith('404.html')) {
      init404Page();
    } else {
      // Default to home page
      initHomePage();
    }
  });

  // Export globally for inline scripting if needed
  window.ChatGPTAdsApp = {
    showToast,
    toggleTheme,
    fetchJSON,
    formatNumber,
    formatDate,
  };
})();
