import { type LoaderFunctionArgs } from "react-router";
import { listAds } from "../lib/db";
import type { AdSort } from "../types";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const advertiser = url.searchParams.get("advertiser") ?? undefined;
  const sort = (url.searchParams.get("sort") as AdSort) || "date_desc";
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 24;
  const minImpressions = url.searchParams.get("min_impressions")
    ? Number(url.searchParams.get("min_impressions"))
    : undefined;
  const maxImpressions = url.searchParams.get("max_impressions")
    ? Number(url.searchParams.get("max_impressions"))
    : undefined;
  const dateFrom = url.searchParams.get("date_from") ?? undefined;
  const dateTo = url.searchParams.get("date_to") ?? undefined;

  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;
  const result = await listAds(db, {
    q,
    advertiser,
    sort,
    page,
    limit,
    minImpressions,
    maxImpressions,
    dateFrom,
    dateTo,
  });

  return Response.json(
    {
      ads: result.ads,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
