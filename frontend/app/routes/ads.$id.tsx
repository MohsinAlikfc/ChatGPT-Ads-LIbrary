import {
  type LoaderFunctionArgs,
  data,
  useLoaderData,
  Link,
  type MetaFunction,
} from "react-router";
import AdGrid from "../components/AdGrid";
import AdvertiserLogo from "../components/AdvertiserLogo";
import { getAd, listAdsByAdvertiser } from "../lib/db";
import { breadcrumbSchema, creativeWorkSchema, webPageSchema } from "../lib/schema";
import { SITE_URL } from "../lib/site";
import { formatDate, formatNumber } from "../lib/utils";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;
  const ad = await getAd(db, id);

  if (!ad) {
    throw new Response("Ad Not Found", { status: 404 });
  }

  // Fetch related ads from the same advertiser for deep internal linking
  const relatedResult = await listAdsByAdvertiser(db, ad.advertiserSlug, {
    limit: 5,
    sort: "impressions_desc",
  }).catch(() => ({ ads: [], total: 0, page: 1, limit: 5 }));

  const relatedAds = relatedResult.ads.filter((item) => item.id !== ad.id).slice(0, 4);

  return data({ ad, relatedAds });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.ad) {
    return [
      { title: "Ad not found — ChatGPT Ads Library" },
      { name: "description", content: "This ad may have been removed or the link is incorrect." },
      { name: "robots", content: "noindex, follow" },
    ];
  }

  const { ad } = data;
  const adUrl = `${SITE_URL}/ads/${ad.id}`;
  const copyTruncated = ad.copy.length > 80 ? `${ad.copy.slice(0, 80)}…` : ad.copy;
  const seoTitle = `${copyTruncated} — ${ad.advertiserName} | ChatGPT Ads Library`;
  const seoDescription =
    ad.description ||
    `${ad.advertiserName} ad running on ChatGPT. Published ${formatDate(ad.publishedDate)}. ${formatNumber(ad.impressions)} impressions.`;
  const seoKeywords = `${ad.advertiserName} ad, ${ad.advertiserName} ChatGPT, ${ad.websiteDomain ?? ""} ad, ChatGPT ad creative, AI advertising`;

  const seoJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Advertisers", path: "/advertisers" },
      { name: ad.advertiserName, path: `/advertisers/${ad.advertiserSlug}` },
      { name: copyTruncated, path: `/ads/${ad.id}` },
    ]),
    webPageSchema({
      url: adUrl,
      name: seoTitle,
      description: seoDescription,
      datePublished: ad.publishedDate ?? undefined,
      speakableSelectors: ["h1", ".ad-copy", ".ad-description"],
    }),
    creativeWorkSchema(ad),
  ];

  const metaTags: any[] = [
    { title: seoTitle },
    { name: "description", content: seoDescription },
    { name: "keywords", content: seoKeywords },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: adUrl },
    { property: "og:site_name", content: "ChatGPT Ads Library" },
    { property: "og:title", content: seoTitle },
    { property: "og:description", content: seoDescription },
    { property: "og:url", content: adUrl },
    { property: "og:type", content: "article" },
    { property: "article:published_time", content: ad.publishedDate ?? undefined },
    { property: "article:author", content: ad.advertiserName },
  ];

  if (ad.mediaUrl) {
    metaTags.push(
      { property: "og:image", content: ad.mediaUrl },
      { property: "og:image:alt", content: `${ad.advertiserName}: ${ad.copy}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ad.mediaUrl }
    );
  } else {
    metaTags.push({ name: "twitter:card", content: "summary" });
  }

  seoJsonLd.forEach((json) => {
    metaTags.push({ "script:ld+json": json });
  });

  return metaTags;
};

export default function AdDetailPage() {
  const { ad, relatedAds } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Visual HTML Breadcrumbs for Crawlers & UX */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Link to="/" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/advertisers" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
          Advertisers
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/advertisers/${ad.advertiserSlug}`}
          className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {ad.advertiserName}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-[200px] truncate text-zinc-800 dark:text-zinc-200" aria-current="page">
          {ad.copy}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <figure className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {ad.mediaUrl ? (
            <img
              src={ad.mediaUrl}
              alt={`${ad.advertiserName} ad: ${ad.copy}`}
              className="h-auto w-full object-contain"
              width="800"
              height="600"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div
              className="flex aspect-video items-center justify-center text-zinc-400"
              aria-label="No image available"
            >
              No image available
            </div>
          )}
          {ad.mediaUrl && (
            <figcaption className="sr-only">
              Advertisement by {ad.advertiserName}: {ad.copy}
            </figcaption>
          )}
        </figure>

        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <AdvertiserLogo src={ad.advertiserLogo} name={ad.advertiserName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {ad.advertiserName}
              </p>
              {ad.websiteDomain ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{ad.websiteDomain}</p>
              ) : null}
            </div>
            <Link
              to={`/advertisers/${ad.advertiserSlug}`}
              className="shrink-0 text-sm font-medium text-brand-500 hover:text-brand-600"
              aria-label={`View all ads from ${ad.advertiserName}`}
            >
              View advertiser
            </Link>
          </div>

          <div>
            <h1 className="ad-copy text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {ad.copy}
            </h1>
            {ad.description ? (
              <p className="ad-description mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                {ad.description}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Date</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <time dateTime={ad.publishedDate ?? undefined}>{formatDate(ad.publishedDate)}</time>
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Impressions
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <span aria-label={`${ad.impressions.toLocaleString()} impressions`}>
                  {formatNumber(ad.impressions)}
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Website</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {ad.websiteUrl ? (
                  <a
                    href={ad.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-500"
                    aria-label={`Visit ${ad.websiteDomain} (opens in new tab)`}
                  >
                    {ad.websiteDomain}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          {ad.websiteUrl ? (
            <a
              href={ad.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              aria-label={`Visit ${ad.advertiserName} website (opens in new tab)`}
            >
              Visit website
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          ) : null}
        </div>
      </div>

      {/* Internal Linking: More ads from this advertiser */}
      {relatedAds && relatedAds.length > 0 && (
        <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                More ads by {ad.advertiserName}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Explore other campaigns running on ChatGPT from {ad.advertiserName}.
              </p>
            </div>
            <Link
              to={`/advertisers/${ad.advertiserSlug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              View all ({ad.advertiserName})
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <AdGrid ads={relatedAds} />
        </section>
      )}
    </div>
  );
}
