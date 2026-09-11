import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdvertiserLogo from "../components/AdvertiserLogo";
import EmptyState from "../components/EmptyState";
import Seo from "../components/Seo";
import Spinner from "../components/Spinner";
import { getAd } from "../lib/api";
import { breadcrumbSchema, creativeWorkSchema, webPageSchema } from "../lib/schema";
import { SITE_URL } from "../lib/site";
import { formatDate, formatNumber } from "../lib/utils";
import type { Ad } from "../types";

type LoadState = "loading" | "ready" | "error";

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoadState("loading");

    getAd(id)
      .then((res) => {
        if (!active) return;
        setAd(res.ad);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loadState === "loading") return <Spinner label="Loading ad…" />;

  if (loadState === "error" || !ad) {
    return (
      <>
        <Seo
          title="Ad not found — ChatGPT Ads Library"
          description="This ad may have been removed or the link is incorrect."
          path="/"
          noindex
        />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="Ad not found"
            description="This ad may have been removed or the link is incorrect."
          />
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm font-medium text-brand-500 hover:text-brand-600">
              ← Back to all ads
            </Link>
          </div>
        </div>
      </>
    );
  }

  const adUrl = `${SITE_URL}/ads/${ad.id}`;

  // Truncate copy to ~160 chars for title safety
  const copyTruncated = ad.copy.length > 80 ? `${ad.copy.slice(0, 80)}…` : ad.copy;
  const seoTitle = `${copyTruncated} — ${ad.advertiserName} | ChatGPT Ads Library`;
  const seoDescription =
    ad.description ||
    `${ad.advertiserName} ad running on ChatGPT. Published ${formatDate(ad.publishedDate)}. ${formatNumber(ad.impressions)} impressions.`;
  const seoKeywords = `${ad.advertiserName} ad, ${ad.advertiserName} ChatGPT, ${ad.websiteDomain ?? ""} ad, ChatGPT ad creative, AI advertising`;

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={`/ads/${ad.id}`}
        type="article"
        image={ad.mediaUrl ?? undefined}
        jsonLd={[
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
        ]}
        keywords={seoKeywords}
        datePublished={ad.publishedDate ?? undefined}
        articleAuthor={ad.advertiserName}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        aria-label="Back to all ads"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to all ads
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
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
            <div className="flex aspect-video items-center justify-center text-zinc-400" aria-label="No image available">
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
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          ) : null}
        </div>
      </div>
      </div>
    </>
  );
}
