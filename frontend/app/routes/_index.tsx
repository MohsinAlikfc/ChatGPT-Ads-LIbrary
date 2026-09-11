import { type LoaderFunctionArgs, data } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { MetaFunction } from "react-router";
import AdGrid from "../components/AdGrid";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import { listAds, getStats } from "../lib/db";
import { datasetSchema, itemListSchema, websiteSchema, webPageSchema } from "../lib/schema";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_URL } from "../lib/site";
import { formatDate, formatNumber } from "../lib/utils";
import type { AdSort } from "../types";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const advertiser = url.searchParams.get("advertiser") ?? "";
  const sort = (url.searchParams.get("sort") as AdSort) || "date_desc";
  const minImpressions = url.searchParams.get("min_impressions");
  const maxImpressions = url.searchParams.get("max_impressions");
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");
  const page = Number(url.searchParams.get("page")) || 1;

  // Typecast to D1Database - Cloudflare environment binding
  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;

  const [adsData, stats] = await Promise.all([
    listAds(db, {
      q: q || undefined,
      advertiser: advertiser || undefined,
      sort,
      page,
      limit: 24,
      minImpressions: minImpressions ? Number(minImpressions) : undefined,
      maxImpressions: maxImpressions ? Number(maxImpressions) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    getStats(db).catch(() => null),
  ]);

  return data({
    ads: adsData.ads,
    total: adsData.total,
    page: adsData.page,
    limit: adsData.limit,
    totalPages: Math.ceil(adsData.total / adsData.limit),
    stats,
    q,
    advertiser,
    sort,
    minImpressions,
    maxImpressions,
    dateFrom,
    dateTo,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  const { page, totalPages, stats, q, advertiser, sort, minImpressions, maxImpressions, dateFrom, dateTo, ads } = data;

  const hasFilters = Boolean(
    advertiser || minImpressions || maxImpressions || dateFrom || dateTo
  );
  const isNonDefaultSort = sort !== "date_desc";
  const isFiltered = hasFilters || Boolean(q) || isNonDefaultSort;

  const seoTitle = q
    ? `Search results for "${q}" — ChatGPT Ads Library`
    : page > 1
      ? `ChatGPT Ads Library — Browse & Search Ads on ChatGPT (Page ${page})`
      : "ChatGPT Ads Library — Browse & Search Ads on ChatGPT";
  const seoDescription = q
    ? `Browse ChatGPT ads matching "${q}". Filter by advertiser, date, and impressions.`
    : page > 1
      ? `Page ${page} of ads running across ChatGPT. Browse ad creative, explore advertisers, and filter by date and impressions.`
      : SITE_DESCRIPTION;

  const canonicalPath = isFiltered
    ? "/"
    : page > 1
      ? `/?page=${page}`
      : "/";
      
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const seoKeywords = q
    ? `${q}, ChatGPT ads, AI advertising, ad library`
    : SITE_KEYWORDS;

  const image = ads[0]?.mediaUrl ?? undefined;

  const seoJsonLd = [
    websiteSchema(),
    webPageSchema({
      url: canonicalUrl,
      name: seoTitle,
      description: seoDescription,
      dateModified: stats?.maxDate ?? undefined,
      speakableSelectors: ["h1", ".hero-description"],
    }),
    datasetSchema(stats ? { totalAds: stats.totalAds, totalAdvertisers: stats.totalAdvertisers, dateModified: stats.maxDate ?? undefined } : undefined),
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
    { property: "og:type", content: "website" },
  ];

  if (image) {
    metaTags.push(
      { property: "og:image", content: image },
      { property: "og:image:alt", content: seoTitle },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: image }
    );
  } else {
    metaTags.push({ name: "twitter:card", content: "summary" });
  }

  // Next / Prev links
  if (!isFiltered && page > 1) {
    metaTags.push({ tagName: "link", rel: "prev", href: `${SITE_URL}${page - 1 === 1 ? "/" : `/?page=${page - 1}`}` });
  }
  if (!isFiltered && page < totalPages) {
    metaTags.push({ tagName: "link", rel: "next", href: `${SITE_URL}/?page=${page + 1}` });
  }

  // JSON-LD scripts
  seoJsonLd.forEach((json) => {
    metaTags.push({
      "script:ld+json": json,
    });
  });

  return metaTags;
};

export default function HomePage() {
  const { ads, total, page, limit, totalPages, stats, q, sort, advertiser, minImpressions, maxImpressions, dateFrom, dateTo } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  function updateFilters(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    setSearchParams(next);
  }

  function buildPageUrl(p: number): string {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    return `/${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const hasFilters = Boolean(
    advertiser || minImpressions || maxImpressions || dateFrom || dateTo
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8" aria-labelledby="hero-heading">
        <h1
          id="hero-heading"
          className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl"
        >
          ChatGPT Ads Library
        </h1>
        <p className="hero-description mt-2 max-w-2xl text-zinc-500 dark:text-zinc-400">
          Browse and search ads running across ChatGPT. Filter by advertiser, date, and
          impressions to see what's live.
        </p>

        {stats ? (
          <div className="mt-5 flex flex-wrap gap-3 text-sm" aria-label="Library statistics">
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {formatNumber(stats.totalAds)} ads
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {formatNumber(stats.totalAdvertisers)} advertisers
            </span>
            {stats.maxDate ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                Last updated: <time dateTime={stats.maxDate}>{formatDate(stats.maxDate)}</time>
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <FilterBar
        sort={sort}
        advertiser={advertiser}
        minImpressions={minImpressions ?? ""}
        maxImpressions={maxImpressions ?? ""}
        dateFrom={dateFrom ?? ""}
        dateTo={dateTo ?? ""}
        hasFilters={hasFilters}
        onSortChange={(value) => updateFilters({ sort: value })}
        onAdvertiserChange={(slug) => updateFilters({ advertiser: slug })}
        onImpressionsChange={(min, max) =>
          updateFilters({ min_impressions: min, max_impressions: max })
        }
        onDateChange={(from, to) => updateFilters({ date_from: from, date_to: to })}
        onClear={clearFilters}
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
          {q ? (
            <>
              Results for <span className="font-medium text-zinc-900 dark:text-zinc-100">"{q}"</span>
              {" · "}
            </>
          ) : null}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatNumber(total)}</span>{" "}
          ads found
        </p>
      </div>

      <div className="mt-5">
        {ads.length === 0 ? (
          <EmptyState
            title="No ads found"
            description="Try adjusting your search or filters to see more results."
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
