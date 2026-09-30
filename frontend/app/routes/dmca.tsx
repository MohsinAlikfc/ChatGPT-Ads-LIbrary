import { Link, type MetaFunction } from "react-router";
import { breadcrumbSchema, webPageSchema } from "../lib/schema";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE, SITE_URL } from "../lib/site";

export const meta: MetaFunction = () => {
  const title = `DMCA Copyright Policy & Takedown Notice — ${SITE_NAME}`;
  const description =
    "DMCA notice and takedown guidelines for ChatGPT Ads Library. Information on reporting alleged copyright infringement.";
  const canonicalUrl = `${SITE_URL}/dmca`;

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

export default function DmcaPolicy() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "DMCA Notice", path: "/dmca" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        url: `${SITE_URL}/dmca`,
        name: `DMCA Notice & Policy — ${SITE_NAME}`,
        description: "DMCA takedown and copyright policy for ChatGPT Ads Library.",
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
          <span className="text-zinc-900 dark:text-zinc-100">DMCA Notice</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Digital Millennium Copyright Act (DMCA) Notice
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last Updated: September 30, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              1. DMCA Compliance Commitment
            </h2>
            <p className="mt-2">
              ChatGPT Ads Library respects the intellectual property rights of others and complies
              with the Digital Millennium Copyright Act (17 U.S.C. § 512). Our archive documents
              publicly visible advertising creatives solely for research, educational, news reporting,
              and public transparency purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              2. Designated DMCA Agent
            </h2>
            <p className="mt-2">
              If you believe your copyrighted material has been used in a manner that constitutes
              infringement, please submit written notice to our designated copyright agent:
            </p>
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">DMCA Agent Contact:</p>
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

          <section>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              3. Takedown Notice Requirements
            </h2>
            <p className="mt-2">Your notice must include:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the specific URL or ad record on our site.</li>
              <li>Your contact information (name, address, telephone number, and email).</li>
              <li>
                A statement that you have a good-faith belief that use of the material is unauthorized.
              </li>
              <li>
                A statement, under penalty of perjury, that the information in the notification is
                accurate.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
