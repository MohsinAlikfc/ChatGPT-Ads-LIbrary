import { type LoaderFunctionArgs } from "react-router";
import { listAdvertisers } from "../lib/db";
import type { AdvertiserSort } from "../types";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const sort = (url.searchParams.get("sort") as AdvertiserSort) || "ad_count_desc";
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 60;

  const db = (context?.cloudflare?.env?.DB ?? (context as any)?.env?.DB) as any;
  const result = await listAdvertisers(db, { q, sort, page, limit });

  return Response.json({
    advertisers: result.advertisers,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}
