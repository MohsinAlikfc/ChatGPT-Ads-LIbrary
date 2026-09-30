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
    robots = 'noindex, follow';
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
    
    ${page === 1 && !isFiltered ? `
    <section class="container mt-16 prose prose-zinc dark:prose-invert max-w-none">
      <h2>Explore Every Ad Running on ChatGPT</h2>
      <p>
        A ChatGPT Ads Library is a searchable collection of sponsored ads appearing inside ChatGPT. It helps marketers, advertisers, and businesses discover which brands are running ads, what messages they use, which industries are active, and how companies approach AI-powered advertising.
      </p>
      <p>
        As ChatGPT becomes a new channel for product discovery and decision-making, understanding ChatGPT ads can help businesses analyze competitors, identify creative trends, and improve their own advertising strategies.
      </p>
      <p>A ChatGPT Ads Library typically includes information such as:</p>
      <ul>
        <li>Advertiser or brand name</li>
        <li>Ad creative and copy</li>
        <li>Industry category</li>
        <li>Triggering search prompt or query</li>
        <li>Landing page information</li>
        <li>Date of observation</li>
        <li>Competitive insights</li>
      </ul>
      <p>
        Instead of manually searching thousands of ChatGPT conversations, an ads library organizes sponsored placements into a structured database that makes research faster.
      </p>

      <h2>Latest ChatGPT Ads</h2>
      <p>
        ChatGPT ads are sponsored placements shown inside ChatGPT experiences. These ads are designed to appear when users explore products, services, or solutions through AI conversations.
      </p>
      <p>
        The latest ChatGPT ads provide insights into how brands are adapting their marketing strategies for AI search. Businesses can analyze:
      </p>
      <ul>
        <li>New advertisers entering ChatGPT</li>
        <li>Popular industries using AI advertising</li>
        <li>Common ad formats</li>
        <li>Messaging patterns</li>
        <li>Calls-to-action used by brands</li>
      </ul>
      <p>
        Tracking recent ChatGPT ads helps marketers understand how companies position themselves when customers use AI assistants for recommendations and comparisons.
      </p>

      <h3>Recently Observed Ads</h3>
      <p>Recently observed ChatGPT ads show which advertisers are appearing in AI-generated search experiences.</p>
      <p>These ads can reveal:</p>
      <ul>
        <li>Which brands are investing in AI advertising</li>
        <li>What customer problems brands target</li>
        <li>Which keywords and topics trigger sponsored placements</li>
        <li>How advertisers write AI-focused ad copy</li>
      </ul>
      <p>
        A regularly updated ChatGPT Ads Library allows marketers to monitor changes in advertising strategies over time.
      </p>

      <h3>Trending ChatGPT Ads</h3>
      <p>Trending ChatGPT ads highlight the campaigns and industries gaining visibility inside AI platforms.</p>
      <p>Common trends include:</p>
      <ul>
        <li>AI software companies promoting productivity tools</li>
        <li>SaaS brands targeting business users</li>
        <li>Financial services promoting solutions</li>
        <li>E-commerce brands reaching buyers during research stages</li>
        <li>Technology companies improving AI search visibility</li>
      </ul>
      <p>
        Analyzing trending ads helps businesses understand what types of offers and messages perform well in AI-driven environments.
      </p>

      <h2>Browse ChatGPT Ads by Industry</h2>
      <p>ChatGPT ads appear across different industries as companies explore AI-powered customer acquisition.</p>
      <p>An industry-based ads library allows users to filter campaigns by market and compare advertising approaches.</p>

      <h3>SaaS &amp; Productivity</h3>
      <p>SaaS companies use ChatGPT ads to promote software solutions, automation tools, project management platforms, and productivity products.</p>
      <p>Common SaaS ad strategies include:</p>
      <ul>
        <li>Highlighting time savings</li>
        <li>Showing product features</li>
        <li>Promoting free trials</li>
        <li>Targeting specific business problems</li>
      </ul>
      <p>Studying SaaS ChatGPT ads helps companies understand how software brands communicate value in AI search environments.</p>

      <h3>AI &amp; Technology</h3>
      <p>AI and technology companies are among the most active users of ChatGPT advertising.</p>
      <p>These ads often focus on:</p>
      <ul>
        <li>Artificial intelligence tools</li>
        <li>Automation platforms</li>
        <li>Developer products</li>
        <li>Data solutions</li>
        <li>Business AI applications</li>
      </ul>
      <p>AI companies use ChatGPT ads to reach users who are already researching technology solutions.</p>

      <h3>Marketing &amp; Advertising</h3>
      <p>Marketing companies use ChatGPT ads to promote SEO tools, advertising platforms, analytics software, and creative solutions.</p>
      <p>Advertisers analyze:</p>
      <ul>
        <li>Competitor messaging</li>
        <li>Ad headlines</li>
        <li>Marketing claims</li>
        <li>Conversion strategies</li>
      </ul>
      <p>A ChatGPT Ads Library helps marketing teams identify new approaches for reaching audiences through AI platforms.</p>

      <h3>Finance &amp; FinTech</h3>
      <p>Finance and FinTech brands use ChatGPT ads to promote financial products, payment solutions, investment tools, and business services.</p>
      <p>These campaigns usually focus on:</p>
      <ul>
        <li>Trust signals</li>
        <li>Security features</li>
        <li>Convenience</li>
        <li>Cost savings</li>
        <li>Customer benefits</li>
      </ul>

      <h3>E-commerce &amp; Retail</h3>
      <p>E-commerce brands use ChatGPT ads to reach customers during product research.</p>
      <p>Retail advertisers may focus on:</p>
      <ul>
        <li>Product comparisons</li>
        <li>Discounts</li>
        <li>Shopping experiences</li>
        <li>Brand advantages</li>
      </ul>
      <p>ChatGPT advertising creates opportunities for brands to appear when users are actively exploring purchase decisions.</p>

      <h2>How to Search and Analyze ChatGPT Ads</h2>
      <p>A ChatGPT Ads Library allows users to search ads by different factors, including brand, industry, keyword, and campaign type.</p>

      <h3>Search Ads by Brand</h3>
      <p>Searching by brand helps businesses understand how competitors advertise inside ChatGPT.</p>
      <p>Brand research can reveal:</p>
      <ul>
        <li>Competitor messaging</li>
        <li>Product positioning</li>
        <li>Promotional offers</li>
        <li>Target audiences</li>
      </ul>

      <h3>Analyze Competitor Strategies</h3>
      <p>Competitor analysis helps marketers identify patterns in AI advertising.</p>
      <p>Businesses can compare:</p>
      <ul>
        <li>Ad copy</li>
        <li>Headlines</li>
        <li>Landing pages</li>
        <li>Calls-to-action</li>
        <li>Customer positioning</li>
      </ul>
      <p>These insights help companies create stronger AI advertising strategies.</p>

      <h3>Discover AI Ad Copy Patterns</h3>
      <p>AI ad copy analysis shows how brands structure messages for ChatGPT users.</p>
      <p>Common patterns include:</p>
      <ul>
        <li>Problem-focused headlines</li>
        <li>Clear product benefits</li>
        <li>Direct calls-to-action</li>
        <li>Short value statements</li>
      </ul>
      <p>Understanding these patterns helps marketers improve their own campaigns.</p>

      <h2>Why Use a ChatGPT Ads Library?</h2>
      <p>A ChatGPT Ads Library provides visibility into a new advertising channel.</p>
      <p>Key benefits include:</p>
      <ul>
        <li>Understanding competitor activity</li>
        <li>Finding new advertising ideas</li>
        <li>Tracking market trends</li>
        <li>Improving creative strategy</li>
        <li>Discovering customer interests</li>
      </ul>
      <p>As AI platforms become part of online research, advertising intelligence becomes important for businesses that want to understand how brands compete in AI search.</p>

      <h2>ChatGPT Ads Library FAQ</h2>
      
      <h3>What is the ChatGPT Ads Library?</h3>
      <p>The ChatGPT Ads Library is a database that collects and organizes ChatGPT advertisements. It allows users to explore sponsored placements, advertiser information, ad creatives, and related campaign details.</p>

      <h3>How does the ChatGPT Ads Library work?</h3>
      <p>A ChatGPT Ads Library works by collecting observed advertisements and organizing them into searchable categories. Users can explore ads by brand, industry, keywords, and other available data points.</p>

      <h3>How are ChatGPT ads collected?</h3>
      <p>ChatGPT ads can be collected through monitoring AI search experiences, recording sponsored placements, and storing information such as advertiser names, ad copy, and related context.</p>

      <h3>How often is the ChatGPT Ads Library updated?</h3>
      <p>The update frequency depends on the platform providing the library. Some databases update continuously as new ChatGPT ads are observed.</p>

      <h3>Can I search ChatGPT ads by brand?</h3>
      <p>Yes. Many ChatGPT Ads Libraries allow users to search ads by advertiser or brand name to analyze competitor campaigns.</p>

      <h3>Can I analyze competitor ads?</h3>
      <p>Yes. A ChatGPT Ads Library can help analyze competitor messaging, creative approaches, and advertising strategies.</p>

      <h3>Can I view ChatGPT ad landing pages?</h3>
      <p>Some ChatGPT Ads Libraries include landing page information when available. This allows marketers to understand how ads connect with conversion pages.</p>

      <h3>How are ChatGPT ads different from Google Ads?</h3>
      <p>Google Ads appear mainly across Google Search and Google properties, while ChatGPT ads appear within AI conversation experiences. ChatGPT advertising focuses on reaching users during conversational research and decision-making.</p>
    </section>
    ` : ''}
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
