import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getAd,
  getAdvertiser,
  getStats,
  listAds,
  listAdsByAdvertiser,
  listAdvertisers,
} from "./db";
import type { Env, ListAdsParams, ListAdvertisersParams } from "./types";

const AD_SORT_VALUES = new Set(["date_desc", "date_asc", "impressions_desc", "impressions_asc"]);
const ADVERTISER_SORT_VALUES = new Set([
  "name_asc",
  "name_desc",
  "ad_count_desc",
  "impressions_desc",
]);

function parseIntParam(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function createApp() {
  const app = new Hono<{ Bindings: Env }>();

  app.use("*", cors());

  app.get("/", (c) =>
    c.json({
      name: "ChatGPT Ads Library API",
      version: "1.0.0",
      endpoints: ["/api/health", "/api/ads", "/api/ads/:id", "/api/advertisers", "/api/advertisers/:slug", "/api/stats"],
    })
  );

  app.get("/api/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

  app.get("/api/stats", async (c) => {
    const stats = await getStats(c.env.DB);
    return c.json(stats);
  });

  app.get("/api/ads", async (c) => {
    const sort = c.req.query("sort");
    const params: ListAdsParams = {
      q: c.req.query("q")?.trim() || undefined,
      advertiser: c.req.query("advertiser")?.trim() || undefined,
      sort: AD_SORT_VALUES.has(sort ?? "") ? (sort as ListAdsParams["sort"]) : "date_desc",
      page: parseIntParam(c.req.query("page")) ?? 1,
      limit: parseIntParam(c.req.query("limit")) ?? 24,
      minImpressions: parseIntParam(c.req.query("min_impressions")),
      maxImpressions: parseIntParam(c.req.query("max_impressions")),
      dateFrom: c.req.query("date_from")?.trim() || undefined,
      dateTo: c.req.query("date_to")?.trim() || undefined,
    };

    const result = await listAds(c.env.DB, params);
    return c.json({
      ads: result.ads,
      pagination: paginationMeta(result.total, result.page, result.limit),
    });
  });

  app.get("/api/ads/:id", async (c) => {
    const ad = await getAd(c.env.DB, c.req.param("id"));
    if (!ad) return c.json({ error: "Ad not found" }, 404);
    return c.json({ ad });
  });

  app.get("/api/advertisers", async (c) => {
    const sort = c.req.query("sort");
    const params: ListAdvertisersParams = {
      q: c.req.query("q")?.trim() || undefined,
      sort: ADVERTISER_SORT_VALUES.has(sort ?? "")
        ? (sort as ListAdvertisersParams["sort"])
        : "ad_count_desc",
      page: parseIntParam(c.req.query("page")) ?? 1,
      limit: parseIntParam(c.req.query("limit")) ?? 60,
    };

    const result = await listAdvertisers(c.env.DB, params);
    return c.json({
      advertisers: result.advertisers,
      pagination: paginationMeta(result.total, result.page, result.limit),
    });
  });

  app.get("/api/advertisers/:slug", async (c) => {
    const slug = c.req.param("slug");
    const advertiser = await getAdvertiser(c.env.DB, slug);
    if (!advertiser) return c.json({ error: "Advertiser not found" }, 404);

    const sort = c.req.query("sort");
    const params: ListAdsParams = {
      sort: AD_SORT_VALUES.has(sort ?? "") ? (sort as ListAdsParams["sort"]) : "date_desc",
      page: parseIntParam(c.req.query("page")) ?? 1,
      limit: parseIntParam(c.req.query("limit")) ?? 24,
    };

    const result = await listAdsByAdvertiser(c.env.DB, slug, params);
    return c.json({
      advertiser,
      ads: result.ads,
      pagination: paginationMeta(result.total, result.page, result.limit),
    });
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}
