import { Link, type MetaFunction } from "react-router";
import { breadcrumbSchema, webPageSchema } from "../lib/schema";
import { SITE_NAME, SITE_URL } from "../lib/site";

export const meta: MetaFunction = () => {
  const title = `Editorial Team & Authors — ${SITE_NAME}`;
  const description =
    "Meet the researchers, data analysts, and editorial team behind the ChatGPT Ads Library transparency archive.";
  const canonicalUrl = `${SITE_URL}/team`;

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

const TEAM_MEMBERS = [
  {
    name: "Mohsin Ali",
    role: "Lead Architect & AI Systems Researcher",
    bio: "Specializing in conversational AI transparency, data engineering, and automated ad monitoring architectures.",
    socials: {
      github: "https://github.com/MohsinAlikfc",
      linkedin: "https://www.linkedin.com/in/mohsinali",
    },
  },
  {
    name: "Editorial Standards Board",
    role: "Ad Classification & Methodology Review",
    bio: "Cross-functional group of digital marketing analysts and AI ethics reviewers overseeing taxonomy and impression estimations.",
    socials: {
      contact: "/contact",
    },
  },
  {
    name: "Data Verification Desk",
    role: "Advertiser Verification & Corrections",
    bio: "Dedicated team reviewing advertiser profile claims, domain matching, and publisher data integrity.",
    socials: {
      contact: "/editorial-guidelines",
    },
  },
];

export default function TeamPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Editorial Team & Authors", path: "/team" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        url: `${SITE_URL}/team`,
        name: `Editorial Team & Authors — ${SITE_NAME}`,
        description: "Editorial team and authors at ChatGPT Ads Library.",
        breadcrumb: breadcrumbSchema(breadcrumbs),
      }),
      {
        "@type": "AboutPage",
        "@id": `${SITE_URL}/team#aboutpage`,
        url: `${SITE_URL}/team`,
        name: `Authors & Researchers — ${SITE_NAME}`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: TEAM_MEMBERS.map((member, i) => ({
            "@type": "Person",
            position: i + 1,
            name: member.name,
            jobTitle: member.role,
            description: member.bio,
            worksFor: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
            },
          })),
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
          <span className="text-zinc-900 dark:text-zinc-100">Editorial Team &amp; Authors</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Editorial Team &amp; Authors
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          The researchers, engineers, and digital advertising analysts dedicated to keeping AI
          advertising accountable, verifiable, and transparent.
        </p>

        <div className="mt-8 space-y-6">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{member.name}</h2>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {member.role}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{member.bio}</p>
            </div>
          ))}
        </div>

        {/* Accountability & Review Statement */}
        <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Our Editorial Standard</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            All database entries and analysis published on ChatGPT Ads Library are curated in
            strict adherence to our{" "}
            <Link
              to="/editorial-guidelines"
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Editorial Guidelines
            </Link>
            . We welcome peer reviews, academic citations, and corrections from brand representatives.
          </p>
        </div>
      </div>
    </>
  );
}
