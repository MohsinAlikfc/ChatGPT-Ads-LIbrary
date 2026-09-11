import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdGrid from "../components/AdGrid";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import Seo from "../components/Seo";
import Spinner from "../components/Spinner";
import { getAds, getStats } from "../lib/api";
import { datasetSchema, itemListSchema, websiteSchema, webPageSchema } from "../lib/schema";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_URL } from "../lib/site";
import { formatDate, formatNumber } from "../lib/utils";
import type { Ad, AdSort, Stats } from "../types";

type LoadState = "loading" | "ready" | "error";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const advertiser = searchParams.get("advertiser") ?? "";
  const sort = (searchParams.get("sort") as AdSort) || "date_desc";
  const minImpressions = searchParams.get("min_impressions") ?? "";
  const maxImpressions = searchParams.get("max_impressions") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";
  const page = Number(searchParams.get("page")) || 1;

  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(24);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    getStats()
      .then((res) => {
        if (active) setStats(res);
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadState("loading");

    getAds({
      q: q || undefined,
      advertiser: advertiser || undefined,
      sort,
      page,
      limit: 24,
      minImpressions: minImpressions ? Number(minImpressions) : undefined,
      maxImpressions: maxImpressions ? Number(maxImpressions) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then((res) => {
        if (!active) return;
        setAds(res.ads);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setLimit(res.pagination.limit);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [q, advertiser, sort, minImpressions, maxImpressions, dateFrom, dateTo, page]);

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

  /** Builds a crawlable URL for each page number in the pagination */
  function buildPageUrl(p: number): string {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    return `/${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const hasFilters = Boolean(
    advertiser || minImpressions || maxImpressions || dateFrom || dateTo
  );
  const isFiltered = hasFilters || Boolean(q);

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
  const prevPath =
    !isFiltered && page > 1 ? (page - 1 === 1 ? "/" : `/?page=${page - 1}`) : undefined;
  const nextPath =
    !isFiltered && page < totalPages ? `/?page=${page + 1}` : undefined;

  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const seoKeywords = q
    ? `${q}, ChatGPT ads, AI advertising, ad library`
    : SITE_KEYWORDS;

  const seoJsonLd = [
    websiteSchema(),
    webPageSchema({
      url: canonicalUrl,
      name: seoTitle,
      description: seoDescription,
      speakableSelectors: ["h1", ".hero-description"],
    }),
    datasetSchema(stats ?? undefined),
    itemListSchema(
      ads.map((ad) => ({
        url: `${SITE_URL}/ads/${ad.id}`,
        name: ad.copy,
        image: ad.mediaUrl,
        description: ad.description,
      }))
    ),
  ];

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        image={ads[0]?.mediaUrl ?? undefined}
        noindex={isFiltered}
        prev={prevPath}
        next={nextPath}
        jsonLd={seoJsonLd}
        keywords={seoKeywords}
      />
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
            {stats.minDate && stats.maxDate ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {formatDate(stats.minDate)} – {formatDate(stats.maxDate)}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <FilterBar
        sort={sort}
        advertiser={advertiser}
        minImpressions={minImpressions}
        maxImpressions={maxImpressions}
        dateFrom={dateFrom}
        dateTo={dateTo}
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
        {loadState === "loading" ? <Spinner label="Loading ads…" /> : null}
        {loadState === "error" ? (
          <EmptyState
            title="Something went wrong"
            description="We couldn't load the ads. Check that the API worker is running and try again."
          />
        ) : null}
        {loadState === "ready" && ads.length === 0 ? (
          <EmptyState
            title="No ads found"
            description="Try adjusting your search or filters to see more results."
          />
        ) : null}
        {loadState === "ready" && ads.length > 0 ? (
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
        ) : null}
      </div>
      </div>
    </>
  );
}
