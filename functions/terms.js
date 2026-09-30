import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const pageTitle = 'Terms of Service — ChatGPT Ads Library';
  const pageDescription = 'Review the Terms of Service for ChatGPT Ads Library. Understand research guidelines, fair use, intellectual property, and disclaimers.';
  const canonicalUrl = `${url.origin}/terms`;

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Legal &amp; Usage</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">Terms of Service</h1>
        <p class="page-subtitle animate-fade-in">
          Terms governing access to the public ChatGPT Ads Library transparency archive.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-3xl mx-auto">
      <div class="card p-8 space-y-6" style="line-height: 1.7; font-size: 0.9375rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">1. Educational &amp; Research Archive</h2>
          <p class="text-muted">
            ChatGPT Ads Library is an independent research platform. We are not affiliated with, endorsed by, or sponsored by OpenAI, Inc. Trademarks are property of their respective owners.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">2. Fair Use Doctrine</h2>
          <p class="text-muted">
            Advertising creatives and brand representations are archived and displayed for news reporting, scholarship, commentary, and public transparency under 17 U.S.C. § 107 (Fair Use).
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">3. Disclaimer</h2>
          <p class="text-muted">
            All records and metrics are provided "as is" for transparency research. While we endeavor to keep the archive accurate, impression data represents estimates based on sampled query volumes.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">4. Inquiries</h2>
          <p class="text-muted">
            For terms inquiries or licensing questions:
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
