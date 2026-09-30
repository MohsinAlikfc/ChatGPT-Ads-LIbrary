import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const pageTitle = 'Editorial Guidelines & Standards — ChatGPT Ads Library';
  const pageDescription = 'Read our editorial standards, verification process, transparency principles, and correction policy for indexing ChatGPT advertisements.';
  const canonicalUrl = `${url.origin}/editorial-guidelines`;

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Ethics &amp; Standards</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">Editorial Guidelines</h1>
        <p class="page-subtitle animate-fade-in">
          Standards for data verification, research neutrality, transparency ethics, and corrections.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-3xl mx-auto">
      <div class="card p-8 space-y-6" style="line-height: 1.7; font-size: 0.9375rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">1. Transparency Objective</h2>
          <p class="text-muted">
            Our mission is providing verifiable transparency for conversational AI advertising. We archive sponsored disclosures and conversational commercial citations strictly for educational, scientific, and public accountability purposes.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">2. Verification Protocol</h2>
          <p class="text-muted">
            All ads archived in this database are observed in live system outputs. Each ad creative record links directly to the advertiser’s verified web domain, with transparent timestamps and impression metrics.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">3. Absolute Commercial Neutrality</h2>
          <p class="text-muted">
            We do not accept commercial payments or compensation to highlight, alter, suppress, or favor any advertiser or campaign. All rankings, counts, and impression calculations are objective and mathematically derived.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">4. Correction Policy</h2>
          <p class="text-muted">
            If an advertiser identifies a clerical error (e.g., misspelled brand name or incorrect brand logo), our Data Verification Desk reviews and resolves requests within 48 business hours at <a href="mailto:contact@chatgpt-ads-library.com" style="color: #10b981; text-decoration: underline;">contact@chatgpt-ads-library.com</a>.
          </p>
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
