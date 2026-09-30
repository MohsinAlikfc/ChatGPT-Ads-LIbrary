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

      {page === 1 && !q && !hasFilters ? (
        <div className="mt-16 prose prose-zinc dark:prose-invert max-w-none">
          <h2>Explore Every Ad Running on ChatGPT</h2>
          <p>
            A ChatGPT Ads Library is a searchable collection of sponsored ads appearing inside ChatGPT. It helps marketers, advertisers, and businesses discover which brands are running ads, what messages they use, which industries are active, and how companies approach AI-powered advertising.
          </p>
          <p>
            As ChatGPT becomes a new channel for product discovery and decision-making, understanding ChatGPT ads can help businesses analyze competitors, identify creative trends, and improve their own advertising strategies.
          </p>
          <p>A ChatGPT Ads Library typically includes information such as:</p>
          <ul>
            <li>Advertiser or brand name</li>
            <li>Ad creative and copy</li>
            <li>Industry category</li>
            <li>Triggering search prompt or query</li>
            <li>Landing page information</li>
            <li>Date of observation</li>
            <li>Competitive insights</li>
          </ul>
          <p>
            Instead of manually searching thousands of ChatGPT conversations, an ads library organizes sponsored placements into a structured database that makes research faster.
          </p>

          <h2>Latest ChatGPT Ads</h2>
          <p>
            ChatGPT ads are sponsored placements shown inside ChatGPT experiences. These ads are designed to appear when users explore products, services, or solutions through AI conversations.
          </p>
          <p>
            The latest ChatGPT ads provide insights into how brands are adapting their marketing strategies for AI search. Businesses can analyze:
          </p>
          <ul>
            <li>New advertisers entering ChatGPT</li>
            <li>Popular industries using AI advertising</li>
            <li>Common ad formats</li>
            <li>Messaging patterns</li>
            <li>Calls-to-action used by brands</li>
          </ul>
          <p>
            Tracking recent ChatGPT ads helps marketers understand how companies position themselves when customers use AI assistants for recommendations and comparisons.
          </p>

          <h3>Recently Observed Ads</h3>
          <p>Recently observed ChatGPT ads show which advertisers are appearing in AI-generated search experiences.</p>
          <p>These ads can reveal:</p>
          <ul>
            <li>Which brands are investing in AI advertising</li>
            <li>What customer problems brands target</li>
            <li>Which keywords and topics trigger sponsored placements</li>
            <li>How advertisers write AI-focused ad copy</li>
          </ul>
          <p>
            A regularly updated ChatGPT Ads Library allows marketers to monitor changes in advertising strategies over time.
          </p>

          <h3>Trending ChatGPT Ads</h3>
          <p>Trending ChatGPT ads highlight the campaigns and industries gaining visibility inside AI platforms.</p>
          <p>Common trends include:</p>
          <ul>
            <li>AI software companies promoting productivity tools</li>
            <li>SaaS brands targeting business users</li>
            <li>Financial services promoting solutions</li>
            <li>E-commerce brands reaching buyers during research stages</li>
            <li>Technology companies improving AI search visibility</li>
          </ul>
          <p>
            Analyzing trending ads helps businesses understand what types of offers and messages perform well in AI-driven environments.
          </p>

          <h2>Browse ChatGPT Ads by Industry</h2>
          <p>ChatGPT ads appear across different industries as companies explore AI-powered customer acquisition.</p>
          <p>An industry-based ads library allows users to filter campaigns by market and compare advertising approaches.</p>

          <h3>SaaS &amp; Productivity</h3>
          <p>SaaS companies use ChatGPT ads to promote software solutions, automation tools, project management platforms, and productivity products.</p>
          <p>Common SaaS ad strategies include:</p>
          <ul>
            <li>Highlighting time savings</li>
            <li>Showing product features</li>
            <li>Promoting free trials</li>
            <li>Targeting specific business problems</li>
          </ul>
          <p>Studying SaaS ChatGPT ads helps companies understand how software brands communicate value in AI search environments.</p>

          <h3>AI &amp; Technology</h3>
          <p>AI and technology companies are among the most active users of ChatGPT advertising.</p>
          <p>These ads often focus on:</p>
          <ul>
            <li>Artificial intelligence tools</li>
            <li>Automation platforms</li>
            <li>Developer products</li>
            <li>Data solutions</li>
            <li>Business AI applications</li>
          </ul>
          <p>AI companies use ChatGPT ads to reach users who are already researching technology solutions.</p>

          <h3>Marketing &amp; Advertising</h3>
          <p>Marketing companies use ChatGPT ads to promote SEO tools, advertising platforms, analytics software, and creative solutions.</p>
          <p>Advertisers analyze:</p>
          <ul>
            <li>Competitor messaging</li>
            <li>Ad headlines</li>
            <li>Marketing claims</li>
            <li>Conversion strategies</li>
          </ul>
          <p>A ChatGPT Ads Library helps marketing teams identify new approaches for reaching audiences through AI platforms.</p>

          <h3>Finance &amp; FinTech</h3>
          <p>Finance and FinTech brands use ChatGPT ads to promote financial products, payment solutions, investment tools, and business services.</p>
          <p>These campaigns usually focus on:</p>
          <ul>
            <li>Trust signals</li>
            <li>Security features</li>
            <li>Convenience</li>
            <li>Cost savings</li>
            <li>Customer benefits</li>
          </ul>

          <h3>E-commerce &amp; Retail</h3>
          <p>E-commerce brands use ChatGPT ads to reach customers during product research.</p>
          <p>Retail advertisers may focus on:</p>
          <ul>
            <li>Product comparisons</li>
            <li>Discounts</li>
            <li>Shopping experiences</li>
            <li>Brand advantages</li>
          </ul>
          <p>ChatGPT advertising creates opportunities for brands to appear when users are actively exploring purchase decisions.</p>

          <h2>How to Search and Analyze ChatGPT Ads</h2>
          <p>A ChatGPT Ads Library allows users to search ads by different factors, including brand, industry, keyword, and campaign type.</p>

          <h3>Search Ads by Brand</h3>
          <p>Searching by brand helps businesses understand how competitors advertise inside ChatGPT.</p>
          <p>Brand research can reveal:</p>
          <ul>
            <li>Competitor messaging</li>
            <li>Product positioning</li>
            <li>Promotional offers</li>
            <li>Target audiences</li>
          </ul>

          <h3>Analyze Competitor Strategies</h3>
          <p>Competitor analysis helps marketers identify patterns in AI advertising.</p>
          <p>Businesses can compare:</p>
          <ul>
            <li>Ad copy</li>
            <li>Headlines</li>
            <li>Landing pages</li>
            <li>Calls-to-action</li>
            <li>Customer positioning</li>
          </ul>
          <p>These insights help companies create stronger AI advertising strategies.</p>

          <h3>Discover AI Ad Copy Patterns</h3>
          <p>AI ad copy analysis shows how brands structure messages for ChatGPT users.</p>
          <p>Common patterns include:</p>
          <ul>
            <li>Problem-focused headlines</li>
            <li>Clear product benefits</li>
            <li>Direct calls-to-action</li>
            <li>Short value statements</li>
          </ul>
          <p>Understanding these patterns helps marketers improve their own campaigns.</p>

          <h2>Why Use a ChatGPT Ads Library?</h2>
          <p>A ChatGPT Ads Library provides visibility into a new advertising channel.</p>
          <p>Key benefits include:</p>
          <ul>
            <li>Understanding competitor activity</li>
            <li>Finding new advertising ideas</li>
            <li>Tracking market trends</li>
            <li>Improving creative strategy</li>
            <li>Discovering customer interests</li>
          </ul>
          <p>As AI platforms become part of online research, advertising intelligence becomes important for businesses that want to understand how brands compete in AI search.</p>

          <h2>ChatGPT Ads Library FAQ</h2>
          
          <h3>What is the ChatGPT Ads Library?</h3>
          <p>The ChatGPT Ads Library is a database that collects and organizes ChatGPT advertisements. It allows users to explore sponsored placements, advertiser information, ad creatives, and related campaign details.</p>

          <h3>How does the ChatGPT Ads Library work?</h3>
          <p>A ChatGPT Ads Library works by collecting observed advertisements and organizing them into searchable categories. Users can explore ads by brand, industry, keywords, and other available data points.</p>

          <h3>How are ChatGPT ads collected?</h3>
          <p>ChatGPT ads can be collected through monitoring AI search experiences, recording sponsored placements, and storing information such as advertiser names, ad copy, and related context.</p>

          <h3>How often is the ChatGPT Ads Library updated?</h3>
          <p>The update frequency depends on the platform providing the library. Some databases update continuously as new ChatGPT ads are observed.</p>

          <h3>Can I search ChatGPT ads by brand?</h3>
          <p>Yes. Many ChatGPT Ads Libraries allow users to search ads by advertiser or brand name to analyze competitor campaigns.</p>

          <h3>Can I analyze competitor ads?</h3>
          <p>Yes. A ChatGPT Ads Library can help analyze competitor messaging, creative approaches, and advertising strategies.</p>

          <h3>Can I view ChatGPT ad landing pages?</h3>
          <p>Some ChatGPT Ads Libraries include landing page information when available. This allows marketers to understand how ads connect with conversion pages.</p>

          <h3>How are ChatGPT ads different from Google Ads?</h3>
          <p>Google Ads appear mainly across Google Search and Google properties, while ChatGPT ads appear within AI conversation experiences. ChatGPT advertising focuses on reaching users during conversational research and decision-making.</p>
        </div>
      ) : null}
    </div>
  );
}
