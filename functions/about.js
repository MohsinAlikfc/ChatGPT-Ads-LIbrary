/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Function: About & Methodology SSR
   Route: GET /about
   ═══════════════════════════════════════════════════════════════════════════ */

import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  let stats = { totalAds: 0, totalAdvertisers: 0, totalImpressions: 0 };
  try {
    const [statsAds, statsAdv, statsImp] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
    ]);
    stats = {
      totalAds: statsAds?.count || 0,
      totalAdvertisers: statsAdv?.count || 0,
      totalImpressions: statsImp?.total || 0,
    };
  } catch (e) {
    console.error('Stats query error in about.js:', e);
  }

  const pageTitle = 'About & Methodology — ChatGPT Ads Library';
  const pageDescription = 'Learn how ChatGPT Ads Library indexes, tracks, and analyzes sponsored placements in AI conversational responses.';
  const canonicalUrl = `${url.origin}/about`;

  const bodyContent = `
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
      <div class="about-grid">
        <div class="card p-6">
          <div class="card-icon-box text-emerald">
            <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 class="card-title mt-4 text-lg font-bold">Public Transparency</h2>
          <p class="card-text mt-2 text-muted">
            As Large Language Models become primary discovery tools, understanding how commercial content and sponsored recommendations are woven into conversations is critical for users, journalists, and researchers.
          </p>
        </div>

        <div class="card p-6">
          <div class="card-icon-box text-emerald">
            <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h2 class="card-title mt-4 text-lg font-bold">Independent Archive</h2>
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
          <h2 class="card-title mt-4 text-lg font-bold">Impression Estimation</h2>
          <p class="card-text mt-2 text-muted">
            Our algorithmic models analyze placement frequency, session sampling, and query volume to provide estimated visibility benchmarks for competitive intelligence.
          </p>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="faq-section mt-12" id="faq">
        <h2 class="section-title text-center text-2xl font-bold">Frequently Asked Questions</h2>
        <p class="section-subtitle text-center text-muted">Common questions about data collection, frequency, and coverage.</p>

        <div class="faq-list mt-6">
          <div class="faq-item p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-4">
            <h3 class="text-base font-semibold">How does ChatGPT Ads Library collect ad data?</h3>
            <p class="mt-2 text-sm text-muted">Data is captured through continuous sampling of sponsored responses, user contribution submissions, and automated indexing that identifies commercial disclosures and sponsored recommendation metadata in conversational responses.</p>
          </div>

          <div class="faq-item p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-4">
            <h3 class="text-base font-semibold">Is this website officially associated with OpenAI?</h3>
            <p class="mt-2 text-sm text-muted">No. ChatGPT Ads Library is an entirely independent research archive. It is not affiliated with, endorsed by, funded by, or sponsored by OpenAI Inc. or any of the advertisers listed in this library.</p>
          </div>

          <div class="faq-item p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-4">
            <h3 class="text-base font-semibold">How are impression numbers calculated?</h3>
            <p class="mt-2 text-sm text-muted">Impressions are estimated based on observed appearance frequency across standardized sampling prompts, aggregate category search volumes, and statistical modeling for comparative benchmarking.</p>
          </div>
        </div>
      </div>

      <div class="disclaimer-callout mt-12 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <h3 class="text-base font-semibold text-main">Legal &amp; Trademark Notice</h3>
        <p class="text-xs text-muted mt-2">
          "ChatGPT", "OpenAI", and associated logos are registered trademarks of OpenAI Inc. All advertiser names, logos, brand assets, and creative copies displayed on this site are the property of their respective copyright and trademark owners. They are displayed here under Fair Use for research, criticism, news reporting, and public transparency purposes.
        </p>
      </div>
    </section>
  `;

  const html = renderPageLayout({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    activeNav: 'about',
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
