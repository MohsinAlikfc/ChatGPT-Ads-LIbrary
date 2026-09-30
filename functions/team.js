import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const pageTitle = 'Editorial Team & Authors — ChatGPT Ads Library';
  const pageDescription = 'Meet the researchers, data analysts, and editorial team behind the ChatGPT Ads Library transparency archive.';
  const canonicalUrl = `${url.origin}/team`;

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Researchers &amp; Contributors</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">Editorial Team &amp; Authors</h1>
        <p class="page-subtitle animate-fade-in">
          The researchers, engineers, and digital advertising analysts dedicated to keeping AI advertising accountable, verifiable, and transparent.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-3xl mx-auto space-y-6">
      <div class="card p-6" style="margin-bottom: 20px;">
        <h2 style="font-size: 1.25rem; font-weight: 700;">Mohsin Ali</h2>
        <p style="color: #10b981; font-size: 0.8125rem; font-weight: 600; margin-top: 2px;">Lead Architect &amp; AI Systems Researcher</p>
        <p class="text-muted" style="margin-top: 10px; font-size: 0.9375rem; line-height: 1.6;">
          Focuses on conversational AI transparency, telemetry architecture, and automated classification systems for sponsored AI responses.
        </p>
      </div>

      <div class="card p-6" style="margin-bottom: 20px;">
        <h2 style="font-size: 1.25rem; font-weight: 700;">Editorial Standards Board</h2>
        <p style="color: #10b981; font-size: 0.8125rem; font-weight: 600; margin-top: 2px;">Ad Classification &amp; Methodology Review</p>
        <p class="text-muted" style="margin-top: 10px; font-size: 0.9375rem; line-height: 1.6;">
          Cross-functional reviewers establishing taxonomies, verifying publisher domain authenticity, and auditing impression estimation models.
        </p>
      </div>

      <div class="card p-6">
        <h2 style="font-size: 1.25rem; font-weight: 700;">Data Verification Desk</h2>
        <p style="color: #10b981; font-size: 0.8125rem; font-weight: 600; margin-top: 2px;">Brand Verification &amp; Inquiries</p>
        <p class="text-muted" style="margin-top: 10px; font-size: 0.9375rem; line-height: 1.6;">
          Processes brand profile claims, verified corporate domain linking, and public dataset accuracy updates.
        </p>
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
