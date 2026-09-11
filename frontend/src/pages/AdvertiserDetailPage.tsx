import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AdGrid from "../components/AdGrid";
import AdvertiserLogo from "../components/AdvertiserLogo";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import Seo from "../components/Seo";
import Spinner from "../components/Spinner";
import { getAdvertiser } from "../lib/api";
import { breadcrumbSchema, itemListSchema, organizationSchema } from "../lib/schema";
import { SITE_URL } from "../lib/site";
import { formatDate, formatNumber } from "../lib/utils";
import type { Ad, AdSort, Advertiser } from "../types";

type LoadState = "loading" | "ready" | "error";

export default function AdvertiserDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = (searchParams.get("sort") as AdSort) || "date_desc";
  const page = Number(searchParams.get("page")) || 1;

  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(24);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoadState("loading");

    getAdvertiser(slug, { sort, page, limit: 24 })
      .then((res) => {
        if (!active) return;
        setAdvertiser(res.advertiser);
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
  }, [slug, sort, page]);

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

  if (loadState === "loading") return <Spinner label="Loading advertiser…" />;

  if (loadState === "error" || !advertiser) {
    return (
      <>
        <Seo
          title="Advertiser not found — ChatGPT Ads Library"
          description="This advertiser may have been removed or the link is incorrect."
          path="/advertisers"
          noindex
        />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="Advertiser not found"
            description="This advertiser may have been removed or the link is incorrect."
          />
          <div className="mt-6 text-center">
            <Link to="/advertisers" className="text-sm font-medium text-brand-500 hover:text-brand-600">
              ← Back to advertisers
            </Link>
          </div>
        </div>
      </>
    );
  }

  const seoTitle = `${advertiser.name} — Advertiser Profile | ChatGPT Ads Library`;
  const seoDescription = `${advertiser.name} has ${advertiser.adCount} ad(s) with ${advertiser.totalImpressions} total impressions running on ChatGPT.`;
  const canonicalPath =
    page > 1 ? `/advertisers/${advertiser.slug}?page=${page}` : `/advertisers/${advertiser.slug}`;
  const prevPath =
    page > 1 ? (page - 1 === 1 ? `/advertisers/${advertiser.slug}` : `/advertisers/${advertiser.slug}?page=${page - 1}`) : undefined;
  const nextPath = page < totalPages ? `/advertisers/${advertiser.slug}?page=${page + 1}` : undefined;

  const seoJsonLd = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Advertisers", path: "/advertisers" },
      { name: advertiser.name, path: `/advertisers/${advertiser.slug}` },
    ]),
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

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        image={advertiser.logo ?? undefined}
        prev={prevPath}
        next={nextPath}
        jsonLd={seoJsonLd}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/advertisers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to advertisers
      </Link>

      <section className="mt-6 flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <AdvertiserLogo src={advertiser.logo} name={advertiser.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {advertiser.name}
          </h1>
          {advertiser.websiteUrl ? (
            <a
              href={advertiser.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              {advertiser.websiteDomain}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Ads</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatNumber(advertiser.adCount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Impressions
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatNumber(advertiser.totalImpressions)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              First seen
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatDate(advertiser.firstSeen)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Last seen
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatDate(advertiser.lastSeen)}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Their ads</h2>
        <select
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

      <div className="mt-5">
        {ads.length === 0 ? (
          <EmptyState title="No ads available" description="This advertiser has no ads in the archive." />
        ) : (
          <div className="animate-fade-in">
            <AdGrid ads={ads} />
            <div className="mt-8">
              <Pagination
                pagination={{ page, limit, total, totalPages }}
                onPageChange={changePage}
              />
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
