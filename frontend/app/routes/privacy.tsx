import { Link, type MetaFunction } from "react-router";
import { breadcrumbSchema, webPageSchema } from "../lib/schema";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE, SITE_URL } from "../lib/site";

export const meta: MetaFunction = () => {
  const title = `Privacy Policy — ${SITE_NAME}`;
  const description =
    "Read the Privacy Policy for ChatGPT Ads Library. Learn how we handle transparency data, analytics, cookies, and protect user privacy.";
  const canonicalUrl = `${SITE_URL}/privacy`;

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

export default function PrivacyPolicy() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Privacy Policy", path: "/privacy" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        url: `${SITE_URL}/privacy`,
        name: `Privacy Policy — ${SITE_NAME}`,
        description: "Privacy policy and data protection practices for ChatGPT Ads Library.",
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
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
          <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-200">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100">Privacy Policy</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last Updated: September 30, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">1. Overview</h2>
            <p className="mt-2">
              ChatGPT Ads Library (“we”, “our”, or “us”) operates an independent, publicly accessible
              research archive monitoring advertising and sponsored content across ChatGPT. We are
              committed to respecting and protecting user privacy and ensuring full compliance with
              applicable privacy regulations including GDPR and CCPA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              2. Information We Do Not Collect
            </h2>
            <p className="mt-2">
              We do not require user accounts, logins, or personal identification to browse the
              archive. We do not sell, rent, or monetize personal user information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              3. Analytics &amp; Cookies
            </h2>
            <p className="mt-2">
              We use aggregated, anonymized web analytics (such as Google Analytics / gtag.js) solely
              to understand website traffic trends, popular queries, and site performance. These tools
              may set essential cookies or local storage keys (such as dark mode preferences) to
              enhance your browsing experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              4. Advertising Data &amp; Transparency Records
            </h2>
            <p className="mt-2">
              All advertising records, images, brand names, and creative texts indexed on this site
              represent publicly displayed commercial advertisements running in conversational AI
              outputs. No private individual conversations or non-commercial private data is stored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              5. Your Rights &amp; Inquiries
            </h2>
            <p className="mt-2">
              Depending on your location, you have rights to access, request deletion, or correct
              information. For privacy-related inquiries, data verification, or questions regarding this
              policy, please contact our Data Protection Officer:
            </p>
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Contact Details:</p>
              <p className="mt-1">
                Email:{" "}
                <a
                  href={`mailto:${SITE_EMAIL}`}
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {SITE_EMAIL}
                </a>
              </p>
              <p className="mt-1">
                Phone:{" "}
                <a href={`tel:${SITE_PHONE.replace(/[^0-9+]/g, "")}`} className="hover:underline">
                  {SITE_PHONE}
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
