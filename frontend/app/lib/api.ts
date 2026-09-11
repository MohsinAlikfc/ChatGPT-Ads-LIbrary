import type {
  Ad,
  AdSort,
  Advertiser,
  AdvertiserSort,
  Pagination,
  Stats,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const message =
      typeof body.error === "string" ? body.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export interface AdsQuery {
  q?: string;
  advertiser?: string;
  sort?: AdSort;
  page?: number;
  limit?: number;
  minImpressions?: number;
  maxImpressions?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdvertisersQuery {
  q?: string;
  sort?: AdvertiserSort;
  page?: number;
  limit?: number;
}

export interface AdsResponse {
  ads: Ad[];
  pagination: Pagination;
}

export interface AdvertisersResponse {
  advertisers: Advertiser[];
  pagination: Pagination;
}

export interface AdvertiserDetailResponse {
  advertiser: Advertiser;
  ads: Ad[];
  pagination: Pagination;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== null) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getAds(params: AdsQuery = {}): Promise<AdsResponse> {
  return request<AdsResponse>(
    `/api/ads${toQuery({
      q: params.q,
      advertiser: params.advertiser,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
      min_impressions: params.minImpressions,
      max_impressions: params.maxImpressions,
      date_from: params.dateFrom,
      date_to: params.dateTo,
    })}`
  );
}

export function getAd(id: string): Promise<{ ad: Ad }> {
  return request<{ ad: Ad }>(`/api/ads/${encodeURIComponent(id)}`);
}

export function getAdvertisers(params: AdvertisersQuery = {}): Promise<AdvertisersResponse> {
  return request<AdvertisersResponse>(
    `/api/advertisers${toQuery({
      q: params.q,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    })}`
  );
}

export function getAdvertiser(slug: string, params: AdsQuery = {}): Promise<AdvertiserDetailResponse> {
  return request<AdvertiserDetailResponse>(
    `/api/advertisers/${encodeURIComponent(slug)}${toQuery({
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    })}`
  );
}

export function getStats(): Promise<Stats> {
  return request<Stats>("/api/stats");
}
