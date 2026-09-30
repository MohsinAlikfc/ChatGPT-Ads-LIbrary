import { Link, type MetaFunction } from "react-router";
import { breadcrumbSchema, webPageSchema } from "../lib/schema";
import { SITE_EMAIL, SITE_NAME, SITE_URL } from "../lib/site";

export const meta: MetaFunction = () => {
  const title = `Editorial Guidelines & Methodology — ${SITE_NAME}`;
  const description =
    "Read our editorial standards, verification process, transparency principles, and correction policy for indexing ChatGPT advertisements.";
  const canonicalUrl = `${SITE_URL}/editorial-guidelines`;

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

export default function EditorialGuidelines() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Editorial Guidelines", path: "/editorial-guidelines" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        url: `${SITE_URL}/editorial-guidelines`,
        name: `Editorial Guidelines & Standards — ${SITE_NAME}`,
        description: "Editorial guidelines and data verification standards for ChatGPT Ads Library.",
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
          <span className="text-zinc-900 dark:text-zinc-100">Editorial Guidelines</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Editorial Guidelines &amp; Standards
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last Updated: September 30, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              1. Core Mission &amp; Purpose
            </h2>
            <p className="mt-2">
              ChatGPT Ads Library is committed to independent, objective, and reproducible research
              regarding the emergence of sponsored advertising across generative AI conversational
              platforms. Our editorial goal is to ensure full transparency for consumers, regulators,
              marketers, and researchers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              2. Data Collection &amp; Verification Protocol
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Automated Ingestion:</strong> Ads are detected via telemetry monitoring of
                publicly served conversational output prompts across diverse topical categories.
              </li>
              <li>
                <strong>Creative Attribution:</strong> Each creative headline, descriptive text, and
                media asset is verified against the advertiser’s authoritative domain.
              </li>
              <li>
                <strong>Metric Estimates:</strong> Impression calculations represent calibrated
                statistical estimates based on observed query volume and placement occurrence rates.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              3. Conflict of Interest &amp; Commercial Independence
            </h2>
            <p className="mt-2">
              We maintain absolute independence. We do not accept payment to feature, promote, hide,
              or favorably rank any advertiser. No advertiser can pay to modify their transparency
              metrics or remove verified historical ad records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              4. Corrections &amp; Updates Policy
            </h2>
            <p className="mt-2">
              When factual errors occur (such as an incorrect corporate parent or typo in a brand
              name), we correct them promptly. Requests for correction should be sent to{" "}
              <a
                href={`mailto:${SITE_EMAIL}`}
                className="text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {SITE_EMAIL}
              </a>{" "}
              along with verifying documentation.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
