import { renderPageLayout } from './_template.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const pageTitle = 'DMCA Copyright Notice & Takedown Policy — ChatGPT Ads Library';
  const pageDescription = 'DMCA notice and copyright policy for ChatGPT Ads Library. Information on designated copyright agent and filing takedown notices.';
  const canonicalUrl = `${url.origin}/dmca`;

  const bodyContent = `
    <section class="page-hero-section">
      <div class="container text-center max-w-3xl mx-auto">
        <div class="hero-badge animate-fade-in mx-auto">
          <span class="badge-dot"></span>
          <span>Copyright Protection</span>
        </div>
        <h1 class="page-title animate-fade-in mt-4">DMCA Copyright Policy</h1>
        <p class="page-subtitle animate-fade-in">
          Procedures for submitting copyright infringement notices under 17 U.S.C. § 512.
        </p>
      </div>
    </section>

    <section class="container py-8 max-w-3xl mx-auto">
      <div class="card p-8 space-y-6" style="line-height: 1.7; font-size: 0.9375rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">1. Safe Harbor Compliance</h2>
          <p class="text-muted">
            ChatGPT Ads Library respects intellectual property rights and adheres to the provisions of the Digital Millennium Copyright Act. We promptly investigate all formal notices of alleged infringement.
          </p>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">2. Designated DMCA Agent</h2>
          <p class="text-muted">
            Please submit written copyright takedown notices to:
          </p>
          <div style="margin-top: 10px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid #27272a; border-radius: 8px;">
            <div><strong>DMCA Agent:</strong> Legal &amp; Compliance Officer</div>
            <div style="margin-top: 4px;">Email: <a href="mailto:contact@chatgpt-ads-library.com" style="color: #10b981; text-decoration: underline;">contact@chatgpt-ads-library.com</a></div>
            <div style="margin-top: 4px;">Phone: <a href="tel:+18005550199" style="color: inherit; text-decoration: underline;">+1 (800) 555-0199</a></div>
          </div>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">3. Required Elements of Notice</h2>
          <ul class="text-muted" style="list-style: disc; padding-left: 20px; margin-top: 8px;">
            <li>Identification of copyrighted work claimed to be infringed.</li>
            <li>Direct URL or ad record link to the material in question.</li>
            <li>Full contact information (name, address, telephone, email).</li>
            <li>A good faith statement that use of the material is not authorized.</li>
            <li>A penalty-of-perjury statement of accuracy and authorization.</li>
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
