import { Link, type MetaFunction } from "react-router";
import { breadcrumbSchema, webPageSchema } from "../lib/schema";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE, SITE_URL } from "../lib/site";

export const meta: MetaFunction = () => {
  const title = `Terms of Service — ${SITE_NAME}`;
  const description =
    "Review the Terms of Service for ChatGPT Ads Library. Understand research guidelines, fair use, intellectual property, and disclaimers.";
  const canonicalUrl = `${SITE_URL}/terms`;

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

export default function TermsOfService() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Terms of Service", path: "/terms" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        url: `${SITE_URL}/terms`,
        name: `Terms of Service — ${SITE_NAME}`,
        description: "Terms and conditions of use for ChatGPT Ads Library.",
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
          <span className="text-zinc-900 dark:text-zinc-100">Terms of Service</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Effective Date: September 30, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using the ChatGPT Ads Library website, you agree to comply with and be
              bound by these Terms of Service. If you do not agree, please discontinue using this
              service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              2. Independent Research &amp; Educational Purpose
            </h2>
            <p className="mt-2">
              ChatGPT Ads Library is an independent, non-affiliated academic and market transparency
              archive. It is not affiliated, endorsed, certified, or sponsored by OpenAI, Inc.,
              ChatGPT, or their partners. All trademarks and brand assets belong to their respective
              owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              3. Fair Use &amp; Intellectual Property
            </h2>
            <p className="mt-2">
              Commercial advertising creative, ad copy, and advertiser brand logos displayed in the
              archive are reproduced strictly for commentary, analysis, news reporting, and public
              transparency under the Fair Use doctrine (17 U.S.C. § 107).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              4. Disclaimer of Warranties
            </h2>
            <p className="mt-2">
              The services and ad data are provided on an “as is” and “as available” basis without
              warranties of any kind. While we strive for accuracy, impression metrics and observed
              dates are estimates based on sampled data points and may vary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              5. Contact &amp; Governance
            </h2>
            <p className="mt-2">
              For any questions regarding our terms, reach us at:
            </p>
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p>
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
