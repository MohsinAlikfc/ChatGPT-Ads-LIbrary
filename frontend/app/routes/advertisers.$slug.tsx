import {
  type LoaderFunctionArgs,
  data,
  useLoaderData,
  useSearchParams,
  Link,
  type MetaFunction,
} from "react-router";
import AdGrid from "../components/AdGrid";
import AdvertiserLogo from "../components/AdvertiserLogo";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import { getAdvertiser, listAdsByAdvertiser } from "../lib/db";
import {
  breadcrumbSchema,
  itemListSchema,
  organizationSchema,
  profilePageSchema,
} from "../lib/schema";
import { SITE_URL } from "../lib/site";
import { formatDate, formatNumber } from "../lib/utils";
import type { AdSort } from "../types";

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { slug } = params;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const sort = (url.searchParams.get("sort") as AdSort) || "date_desc";
  const page = Number(url.searchParams.get("page")) || 1;

  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;

  const [advertiser, adsData] = await Promise.all([
    getAdvertiser(db, slug),
    listAdsByAdvertiser(db, slug, { sort, page, limit: 24 }),
  ]);

  if (!advertiser) {
    throw new Response("Advertiser Not Found", { status: 404 });
  }

  return data({
    advertiser,
    ads: adsData.ads,
    total: adsData.total,
    page: adsData.page,
    limit: adsData.limit,
    totalPages: Math.ceil(adsData.total / adsData.limit),
    sort,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.advertiser) {
    return [
      { title: "Advertiser not found — ChatGPT Ads Library" },
      { name: "description", content: "This advertiser may have been removed or the link is incorrect." },
      { name: "robots", content: "noindex, follow" },
    ];
  }

  const { advertiser, ads, page, totalPages, sort } = data;
  const isNonDefaultSort = sort !== "date_desc";
  const isFiltered = isNonDefaultSort;

  const seoTitle =
    page > 1
      ? `${advertiser.name} — Ads on ChatGPT (Page ${page}) | ChatGPT Ads Library`
      : `${advertiser.name} — Ads on ChatGPT | ChatGPT Ads Library`;
  const seoDescription =
    `${advertiser.name} has run ${advertiser.adCount} ad(s) on ChatGPT with ${formatNumber(advertiser.totalImpressions)} total impressions.` +
    (page > 1 ? ` Viewing page ${page}.` : "");

  const canonicalPath = isFiltered
    ? `/advertisers/${advertiser.slug}`
    : page > 1
      ? `/advertisers/${advertiser.slug}?page=${page}`
      : `/advertisers/${advertiser.slug}`;

  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const seoKeywords = `${advertiser.name} ads, ${advertiser.name} ChatGPT advertising, ${advertiser.websiteDomain ?? ""} ads, ChatGPT advertiser profile`;

  const seoJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Advertisers", path: "/advertisers" },
      { name: advertiser.name, path: `/advertisers/${advertiser.slug}` },
    ]),
    profilePageSchema(advertiser),
    organizationSchema(advertiser),
    itemListSchema(
      ads.map((ad) => ({
        url: `${SITE_URL}/ads/${ad.id}`,
        name: ad.copy,
        image: ad.mediaUrl,
        description: ad.description,
      }))
    ),
  ];

  const metaTags: any[] = [
    { title: seoTitle },
    { name: "description", content: seoDescription },
    { name: "keywords", content: seoKeywords },
    { name: "robots", content: isFiltered ? "noindex, follow" : "index, follow" },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    { property: "og:site_name", content: "ChatGPT Ads Library" },
    { property: "og:title", content: seoTitle },
    { property: "og:description", content: seoDescription },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: "profile" },
  ];

  if (advertiser.logo) {
    metaTags.push(
      { property: "og:image", content: advertiser.logo },
      { property: "og:image:alt", content: advertiser.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: advertiser.logo }
    );
  } else {
    metaTags.push({ name: "twitter:card", content: "summary" });
  }

  if (!isFiltered && page > 1) {
    metaTags.push({
      tagName: "link",
      rel: "prev",
      href: `${SITE_URL}${page - 1 === 1 ? `/advertisers/${advertiser.slug}` : `/advertisers/${advertiser.slug}?page=${page - 1}`}`,
    });
  }
  if (!isFiltered && page < totalPages) {
    metaTags.push({
      tagName: "link",
      rel: "next",
      href: `${SITE_URL}/advertisers/${advertiser.slug}?page=${page + 1}`,
    });
  }

  seoJsonLd.forEach((json) => {
    metaTags.push({ "script:ld+json": json });
  });

  return metaTags;
};

export default function AdvertiserDetailPage() {
  const { advertiser, ads, total, page, limit, totalPages, sort } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  function changeSort(value: AdSort) {
    const next = new URLSearchParams(searchParams);
    next.set("sort", value);
    next.delete("page");
    setSearchParams(next);
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  function buildPageUrl(p: number): string {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    return `/advertisers/${advertiser.slug}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/advertisers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        aria-label="Back to all advertisers"
      >
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
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to advertisers
      </Link>

      <section
        className="mt-6 flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900"
        aria-labelledby="advertiser-name"
      >
        <AdvertiserLogo src={advertiser.logo} name={advertiser.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1
            id="advertiser-name"
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {advertiser.name}
          </h1>
          {advertiser.websiteUrl ? (
            <a
              href={advertiser.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
              aria-label={`Visit ${advertiser.name} website (opens in new tab)`}
            >
              {advertiser.websiteDomain}
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
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

        <dl className="flex flex-wrap gap-6 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Ads</dt>
            <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatNumber(advertiser.adCount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Impressions
            </dt>
            <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatNumber(advertiser.totalImpressions)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              First seen
            </dt>
            <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              <time dateTime={advertiser.firstSeen ?? undefined}>
                {formatDate(advertiser.firstSeen)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Last seen
            </dt>
            <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              <time dateTime={advertiser.lastSeen ?? undefined}>
                {formatDate(advertiser.lastSeen)}
              </time>
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Their ads</h2>
        <div>
          <label className="sr-only" htmlFor="ad-sort">
            Sort ads
          </label>
          <select
            id="ad-sort"
            value={sort}
            onChange={(event) => changeSort(event.target.value as AdSort)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="impressions_desc">Most impressions</option>
            <option value="impressions_asc">Fewest impressions</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {ads.length === 0 ? (
          <EmptyState
            title="No ads available"
            description="This advertiser has no ads in the archive."
          />
        ) : (
          <div className="animate-fade-in">
            <AdGrid ads={ads} />
            <div className="mt-8">
              <Pagination
                pagination={{ page, limit, total, totalPages }}
                onPageChange={changePage}
                buildPageUrl={buildPageUrl}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
