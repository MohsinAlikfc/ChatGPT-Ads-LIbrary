import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const pageTitle = 'HTML Sitemap & Archive Index — ChatGPT Ads Library';
  const pageDescription = 'Directory and navigational HTML sitemap of all sections, pages, advertiser directories, and legal documentation on ChatGPT Ads Library.';
  const canonicalUrl = `${url.origin}/sitemap`;

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Site Directory</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">HTML Sitemap</h1>
        <p class="page-subtitle animate-fade-in">
          Complete index of all public pages, directories, and documentation across the archive.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-4xl mx-auto">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
        <div class="card p-6">
          <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 12px;">Core Archive</h2>
          <ul class="space-y-2 text-sm text-muted" style="list-style: disc; padding-left: 20px;">
            <li><a href="/" style="color: #10b981; text-decoration: underline;">Ads Archive (Homepage)</a></li>
            <li><a href="/advertisers" style="color: #10b981; text-decoration: underline;">All Advertisers Directory</a></li>
            <li><a href="/categories" style="color: #10b981; text-decoration: underline;">Ad Categories Index</a></li>
            <li><a href="/about" style="color: #10b981; text-decoration: underline;">About &amp; Methodology</a></li>
          </ul>
        </div>

        <div class="card p-6">
          <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 12px;">Trust &amp; Governance</h2>
          <ul class="space-y-2 text-sm text-muted" style="list-style: disc; padding-left: 20px;">
            <li><a href="/privacy" style="color: #10b981; text-decoration: underline;">Privacy Policy</a></li>
            <li><a href="/terms" style="color: #10b981; text-decoration: underline;">Terms of Service</a></li>
            <li><a href="/contact" style="color: #10b981; text-decoration: underline;">Contact Us</a></li>
            <li><a href="/team" style="color: #10b981; text-decoration: underline;">Editorial Team &amp; Authors</a></li>
            <li><a href="/editorial-guidelines" style="color: #10b981; text-decoration: underline;">Editorial Guidelines</a></li>
            <li><a href="/dmca" style="color: #10b981; text-decoration: underline;">DMCA Notice</a></li>
          </ul>
        </div>

        <div class="card p-6">
          <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 12px;">Technical &amp; Feeds</h2>
          <ul class="space-y-2 text-sm text-muted" style="list-style: disc; padding-left: 20px;">
            <li><a href="/sitemap.xml" target="_blank" style="color: #10b981; text-decoration: underline;">XML Sitemap (/sitemap.xml)</a></li>
            <li><a href="/robots.txt" target="_blank" style="color: #10b981; text-decoration: underline;">Robots File (/robots.txt)</a></li>
            <li><a href="/llms.txt" target="_blank" style="color: #10b981; text-decoration: underline;">LLM Context Feed (/llms.txt)</a></li>
          </ul>
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
