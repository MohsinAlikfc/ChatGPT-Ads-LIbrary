import { type FormEvent, useState } from "react";
import {
  type LoaderFunctionArgs,
  data,
  useLoaderData,
  useSearchParams,
  Link,
  type MetaFunction,
} from "react-router";
import AdvertiserLogo from "../components/AdvertiserLogo";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import { listAdvertisers } from "../lib/db";
import {
  breadcrumbSchema,
  collectionPageSchema,
  itemListSchema,
  webPageSchema,
} from "../lib/schema";
import { SITE_URL } from "../lib/site";
import { formatNumber } from "../lib/utils";
import type { AdvertiserSort } from "../types";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const sort = (url.searchParams.get("sort") as AdvertiserSort) || "ad_count_desc";
  const page = Number(url.searchParams.get("page")) || 1;

  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;

  const dataResult = await listAdvertisers(db, {
    q: q || undefined,
    sort,
    page,
    limit: 60,
  });

  return data({
    advertisers: dataResult.advertisers,
    total: dataResult.total,
    page: dataResult.page,
    limit: dataResult.limit,
    totalPages: Math.ceil(dataResult.total / dataResult.limit),
    q,
    sort,
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  const { q, sort, page, totalPages, advertisers } = data;

  const isNonDefaultSort = sort !== "ad_count_desc";
  const isFiltered = Boolean(q) || isNonDefaultSort;

  const seoTitle = q
    ? `Search results for "${q}" — Advertisers | ChatGPT Ads Library`
    : page > 1
      ? `Advertisers on ChatGPT — Page ${page} | ChatGPT Ads Library`
      : "Advertisers on ChatGPT — ChatGPT Ads Library";
  const seoDescription = q
    ? `Advertisers matching "${q}" running ads on ChatGPT.`
    : page > 1
      ? `Page ${page} of advertisers running ads on ChatGPT. Browse ad counts and total impressions.`
      : "Browse every advertiser running ads on ChatGPT, with ad counts and total impressions.";

  const canonicalPath = isFiltered
    ? "/advertisers"
    : page > 1
      ? `/advertisers?page=${page}`
      : "/advertisers";

  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const seoKeywords = q
    ? `${q} ChatGPT advertiser, ads on ChatGPT, ChatGPT advertising`
    : "ChatGPT advertisers, brands advertising on ChatGPT, ChatGPT ad library, AI advertising companies";

  const seoJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Advertisers", path: "/advertisers" },
    ]),
    collectionPageSchema({
      url: canonicalUrl,
      name: "Advertisers on ChatGPT",
      description:
        "All brands and companies running ads on ChatGPT, with ad counts and impression data.",
    }),
    webPageSchema({
      url: canonicalUrl,
      name: seoTitle,
      description: seoDescription,
      speakableSelectors: ["h1"],
    }),
    itemListSchema(
      advertisers.map((advertiser) => ({
        url: `${SITE_URL}/advertisers/${advertiser.slug}`,
        name: advertiser.name,
        image: advertiser.logo,
        description: `${advertiser.name} — ${advertiser.adCount} ads, ${advertiser.totalImpressions} impressions`,
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
    { name: "twitter:card", content: "summary" },
  ];

  if (!isFiltered && page > 1) {
    metaTags.push({
      tagName: "link",
      rel: "prev",
      href: `${SITE_URL}${page - 1 === 1 ? "/advertisers" : `/advertisers?page=${page - 1}`}`,
    });
  }
  if (!isFiltered && page < totalPages) {
    metaTags.push({
      tagName: "link",
      rel: "next",
      href: `${SITE_URL}/advertisers?page=${page + 1}`,
    });
  }

  seoJsonLd.forEach((json) => {
    metaTags.push({ "script:ld+json": json });
  });

  return metaTags;
};

export default function AdvertisersPage() {
  const { advertisers, total, page, limit, totalPages, q, sort } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(q);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const value = query.trim();
    if (value) next.set("q", value);
    else next.delete("q");
    next.delete("page");
    setSearchParams(next);
  }

  function changeSort(value: AdvertiserSort) {
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
    return `/advertisers${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Advertisers
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {formatNumber(total)} advertisers running ads on ChatGPT.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={submitSearch} role="search" aria-label="Search advertisers">
            <label className="sr-only" htmlFor="advertiser-search">
              Search advertisers
            </label>
            <input
              id="advertiser-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search advertisers…"
              autoComplete="organization"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 sm:w-64"
            />
          </form>
          <label className="sr-only" htmlFor="advertiser-sort">
            Sort advertisers
          </label>
          <select
            id="advertiser-sort"
            value={sort}
            onChange={(event) => changeSort(event.target.value as AdvertiserSort)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="ad_count_desc">Most ads</option>
            <option value="impressions_desc">Most impressions</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </div>
      </div>

      {advertisers.length === 0 ? (
        <EmptyState title="No advertisers found" description="Try a different search term." />
      ) : (
        <div className="animate-fade-in">
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0"
            aria-label="Advertisers list"
          >
            {advertisers.map((advertiser) => (
              <li key={advertiser.slug}>
                <Link
                  to={`/advertisers/${advertiser.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  aria-label={`${advertiser.name} — ${advertiser.adCount} ads`}
                >
                  <AdvertiserLogo src={advertiser.logo} name={advertiser.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {advertiser.name}
                    </h2>
                    {advertiser.websiteDomain ? (
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {advertiser.websiteDomain}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                      {advertiser.adCount} ads · {formatNumber(advertiser.totalImpressions)}{" "}
                      impressions
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

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
  );
}
