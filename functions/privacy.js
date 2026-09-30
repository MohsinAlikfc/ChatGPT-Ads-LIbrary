import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const pageTitle = 'Privacy Policy — ChatGPT Ads Library';
  const pageDescription = 'Read the Privacy Policy for ChatGPT Ads Library. Learn how we handle transparency data, cookies, and protect user privacy.';
  const canonicalUrl = `${url.origin}/privacy`;

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Legal &amp; Privacy</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">Privacy Policy</h1>
        <p class="page-subtitle animate-fade-in">
          Our commitment to open transparency, ethical AI research, and protecting user privacy.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-3xl mx-auto">
      <div class="card p-8 space-y-6" style="line-height: 1.7; font-size: 0.9375rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">1. Overview</h2>
          <p class="text-muted">
            ChatGPT Ads Library is an independent public interest research archive dedicated to monitoring advertising disclosures and commercial placements across ChatGPT. We do not sell personal data, require user registration, or track private conversations.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">2. Analytics &amp; Cookies</h2>
          <p class="text-muted">
            We use anonymized telemetry (e.g. Google Analytics / gtag.js) solely for aggregate traffic analysis, error monitoring, and interface optimization. You can opt out at any time via browser settings.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">3. Advertising Records</h2>
          <p class="text-muted">
            All advertising copy, media creative, brand names, and domains indexed in this archive are publicly displayed commercial advertisements. No private user conversations are collected or stored.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">4. Contact &amp; Rights</h2>
          <p class="text-muted">
            For questions, data verification, or privacy requests, contact:
          </p>
          <div style="margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid #27272a; border-radius: 8px;">
            <div>Email: <a href="mailto:contact@chatgpt-ads-library.com" style="color: #10b981; text-decoration: underline;">contact@chatgpt-ads-library.com</a></div>
            <div>Phone: <a href="tel:+18005550199" style="color: inherit; text-decoration: underline;">+1 (800) 555-0199</a></div>
          </div>
        </div>
      </div>
    </section>
  `;

  const html = renderPageLayout({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl,
    activeNav: '',
    bodyContent,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
