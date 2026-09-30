/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Middleware
   Enforces consistent URL normalization across all pages:
   - Redirects URLs with a trailing slash to non-trailing slash version (301/308)
   - Preserves root path '/'
   ═══════════════════════════════════════════════════════════════════════════ */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // If path has a trailing slash and is not root ('/'), 301 redirect to clean path
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    const cleanPath = url.pathname.replace(/\/+$/, '');
    const cleanUrl = new URL(cleanPath + url.search + url.hash, url.origin);
    const status = (request.method === 'GET' || request.method === 'HEAD') ? 301 : 308;
    return Response.redirect(cleanUrl.toString(), status);
  }

  return context.next();
}
