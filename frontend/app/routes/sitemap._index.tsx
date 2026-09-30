import { Link, type MetaFunction } from "react-router";
import { breadcrumbSchema, webPageSchema } from "../lib/schema";
import { SITE_NAME, SITE_URL } from "../lib/site";

export const meta: MetaFunction = () => {
  const title = `HTML Sitemap — All Pages & Directory — ${SITE_NAME}`;
  const description =
    "Complete directory and HTML sitemap of the ChatGPT Ads Library archive, top advertisers, methodology, and legal documentation.";
  const canonicalUrl = `${SITE_URL}/sitemap`;

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: "website" },
  ];
};

const FEATURED_ADVERTISERS = [
  { name: "Ezoic Inc", slug: "ezoic-inc" },
  { name: "Criteo", slug: "criteo" },
  { name: "ZoomInfo", slug: "zoominfo-technologies-inc" },
  { name: "On Running", slug: "on" },
  { name: "OpenAI", slug: "openai" },
  { name: "OneTrust", slug: "onetrust" },
  { name: "Hilltop Ads", slug: "hilltop-ads-ltd" },
  { name: "Ai Media Group", slug: "ai-media-group" },
  { name: "JumpFly", slug: "jumpfly" },
  { name: "Asana", slug: "asana" },
  { name: "Clickguard", slug: "clickguard" },
  { name: "Gravity", slug: "gravity" },
];

export default function HtmlSitemap() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "HTML Sitemap", path: "/sitemap" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        url: `${SITE_URL}/sitemap`,
        name: `HTML Sitemap — ${SITE_NAME}`,
        description: "HTML sitemap and index of all sections of the ChatGPT Ads Library.",
        breadcrumb: breadcrumbSchema(breadcrumbs),
      }),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
          <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-200">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100">HTML Sitemap</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          HTML Sitemap &amp; Archive Index
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          Comprehensive navigational directory of all public pages, advertiser profiles, and
          transparency reports.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Main Sections */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Primary Navigation
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link to="/" className="text-emerald-600 hover:underline dark:text-emerald-400">
                  Ads Archive (Home)
                </Link>
              </li>
              <li>
                <Link
                  to="/advertisers"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  All Advertisers Directory
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  About &amp; Methodology
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Governance */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Trust &amp; Governance
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link
                  to="/privacy"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/team"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Editorial Team &amp; Authors
                </Link>
              </li>
              <li>
                <Link
                  to="/editorial-guidelines"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Editorial Guidelines
                </Link>
              </li>
              <li>
                <Link
                  to="/dmca"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  DMCA Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Machine & XML Feeds */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Machine Feeds &amp; SEO
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  XML Sitemap (/sitemap.xml)
                </a>
              </li>
              <li>
                <a
                  href="/robots.txt"
                  target="_blank"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Robots File (/robots.txt)
                </a>
              </li>
              <li>
                <a
                  href="/llms.txt"
                  target="_blank"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  LLM Context Feed (/llms.txt)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Featured Advertisers Subsection */}
        <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Top Featured Advertisers
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 text-xs">
            {FEATURED_ADVERTISERS.map((adv) => (
              <Link
                key={adv.slug}
                to={`/advertisers/${adv.slug}`}
                className="truncate text-zinc-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
              >
                {adv.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
