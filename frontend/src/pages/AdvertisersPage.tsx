import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdvertiserLogo from "../components/AdvertiserLogo";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import Seo from "../components/Seo";
import Spinner from "../components/Spinner";
import { getAdvertisers } from "../lib/api";
import { breadcrumbSchema, itemListSchema } from "../lib/schema";
import { SITE_URL } from "../lib/site";
import { formatNumber } from "../lib/utils";
import type { Advertiser, AdvertiserSort } from "../types";

type LoadState = "loading" | "ready" | "error";

export default function AdvertisersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") as AdvertiserSort) || "ad_count_desc";
  const page = Number(searchParams.get("page")) || 1;

  const [query, setQuery] = useState(q);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(60);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    let active = true;
    setLoadState("loading");

    getAdvertisers({
      q: q || undefined,
      sort,
      page,
      limit: 60,
    })
      .then((res) => {
        if (!active) return;
        setAdvertisers(res.advertisers);
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
  }, [q, sort, page]);

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

  const seoTitle = q
    ? `Search results for "${q}" — Advertisers | ChatGPT Ads Library`
    : "Advertisers — ChatGPT Ads Library";
  const seoDescription = q
    ? `Advertisers matching "${q}" running ads on ChatGPT.`
    : "Browse every advertiser running ads on ChatGPT, with ad counts and total impressions.";
  const canonicalPath = q ? "/advertisers" : page > 1 ? `/advertisers?page=${page}` : "/advertisers";
  const prevPath = !q && page > 1 ? (page - 1 === 1 ? "/advertisers" : `/advertisers?page=${page - 1}`) : undefined;
  const nextPath = !q && page < totalPages ? `/advertisers?page=${page + 1}` : undefined;

  const seoJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Advertisers", path: "/advertisers" },
    ]),
    itemListSchema(
      advertisers.map((advertiser) => ({
        url: `${SITE_URL}/advertisers/${advertiser.slug}`,
        name: advertiser.name,
        image: advertiser.logo,
        description: `${advertiser.name} — ${advertiser.adCount} ads, ${advertiser.totalImpressions} impressions`,
      }))
    ),
  ];

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        noindex={Boolean(q)}
        prev={prevPath}
        next={nextPath}
        jsonLd={seoJsonLd}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Advertisers
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {formatNumber(total)} advertisers running ads on ChatGPT.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={submitSearch}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search advertisers…"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 sm:w-64"
            />
          </form>
          <select
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

      {loadState === "loading" ? <Spinner label="Loading advertisers…" /> : null}
      {loadState === "error" ? (
        <EmptyState
          title="Something went wrong"
          description="We couldn't load advertisers. Check that the API worker is running."
        />
      ) : null}
      {loadState === "ready" && advertisers.length === 0 ? (
        <EmptyState title="No advertisers found" description="Try a different search term." />
      ) : null}
      {loadState === "ready" && advertisers.length > 0 ? (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {advertisers.map((advertiser) => (
              <Link
                key={advertiser.slug}
                to={`/advertisers/${advertiser.slug}`}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
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
            ))}
          </div>

          <div className="mt-8">
            <Pagination
              pagination={{ page, limit, total, totalPages }}
              onPageChange={changePage}
            />
          </div>
        </div>
      ) : null}
      </div>
    </>
  );
}
