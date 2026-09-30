import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const pageTitle = 'Contact Us — ChatGPT Ads Library';
  const pageDescription = 'Get in touch with the ChatGPT Ads Library editorial and research team for inquiries, advertiser verification, or data corrections.';
  const canonicalUrl = `${url.origin}/contact`;

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Reach Our Team</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">Contact Us</h1>
        <p class="page-subtitle animate-fade-in">
          Have a question about indexed ad creative, advertiser verification, or data research? We’d love to hear from you.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-3xl mx-auto">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="card p-6">
          <div style="display: inline-flex; padding: 10px; border-radius: 8px; background: rgba(16, 185, 129, 0.1); color: #10b981;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </div>
          <h2 style="font-size: 1.125rem; font-weight: 700; margin-top: 14px;">Email Support</h2>
          <p class="text-muted" style="font-size: 0.8125rem; margin-top: 4px;">General inquiries, press, and data verification.</p>
          <p style="margin-top: 12px; font-weight: 600;">
            <a href="mailto:contact@chatgpt-ads-library.com" style="color: #10b981; text-decoration: underline;">contact@chatgpt-ads-library.com</a>
          </p>
          <p style="font-size: 0.75rem; color: #71717a; margin-top: 4px;">Average response time: 24–48 hours</p>
        </div>

        <div class="card p-6">
          <div style="display: inline-flex; padding: 10px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </div>
          <h2 style="font-size: 1.125rem; font-weight: 700; margin-top: 14px;">Telephone Hotline</h2>
          <p class="text-muted" style="font-size: 0.8125rem; margin-top: 4px;">Media, academic research &amp; legal inquiries.</p>
          <p style="margin-top: 12px; font-weight: 600;">
            <a href="tel:+18005550199" style="color: inherit; text-decoration: underline;">+1 (800) 555-0199</a>
          </p>
          <p style="font-size: 0.75rem; color: #71717a; margin-top: 4px;">Mon–Fri, 9:00 AM – 5:00 PM EST</p>
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
