import { Link, type MetaFunction } from "react-router";
import { breadcrumbSchema, webPageSchema } from "../lib/schema";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE, SITE_URL } from "../lib/site";

export const meta: MetaFunction = () => {
  const title = `Contact Us — ${SITE_NAME}`;
  const description =
    "Get in touch with the ChatGPT Ads Library editorial and research team. Inquire about ad verification, brand profiles, partnerships, or data corrections.";
  const canonicalUrl = `${SITE_URL}/contact`;

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

export default function ContactUs() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Contact Us", path: "/contact" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        url: `${SITE_URL}/contact`,
        name: `Contact Us — ${SITE_NAME}`,
        description: "Contact information for the ChatGPT Ads Library team.",
        breadcrumb: breadcrumbSchema(breadcrumbs),
      }),
      {
        "@type": "ContactPage",
        "@id": `${SITE_URL}/contact#contactpage`,
        url: `${SITE_URL}/contact`,
        name: `Contact ${SITE_NAME}`,
        mainEntity: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          email: SITE_EMAIL,
          telephone: SITE_PHONE,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: SITE_PHONE,
            contactType: "Editorial & Support",
            email: SITE_EMAIL,
            availableLanguage: ["English"],
          },
        },
      },
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
          <span className="text-zinc-900 dark:text-zinc-100">Contact Us</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          Have a question about indexed ad creative, advertiser verification, or data research? We’d
          love to hear from you.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Email Support Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Email Editorial Team
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              General inquiries, press, and data verification.
            </p>
            <p className="mt-4 text-sm font-semibold">
              <a
                href={`mailto:${SITE_EMAIL}`}
                className="text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {SITE_EMAIL}
              </a>
            </p>
            <p className="mt-1 text-xs text-zinc-400">Average response time: 24–48 hours</p>
          </div>

          {/* Telephone Support Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Phone Hotline</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Direct voice contact for media &amp; legal inquiries.
            </p>
            <p className="mt-4 text-sm font-semibold">
              <a
                href={`tel:${SITE_PHONE.replace(/[^0-9+]/g, "")}`}
                className="text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {SITE_PHONE}
              </a>
            </p>
            <p className="mt-1 text-xs text-zinc-400">Mon–Fri, 9:00 AM – 5:00 PM EST</p>
          </div>
        </div>

        {/* Inquiries Guide */}
        <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Frequently Contacted Inquiries
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>Advertiser Verification:</strong> Are you a brand manager wanting to verify
              your company profile? Email us with your official company domain address.
            </li>
            <li>
              <strong>Research &amp; Data Licensing:</strong> Academic institutions and researchers
              can request bulk datasets or API access for AI transparency studies.
            </li>
            <li>
              <strong>DMCA &amp; Takedown:</strong> For copyright matters, please review our{" "}
              <Link to="/dmca" className="text-emerald-600 hover:underline dark:text-emerald-400">
                DMCA Notice
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
