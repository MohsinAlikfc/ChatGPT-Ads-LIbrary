export interface Env {
  DB: D1Database;
  ADS_IMAGES: R2Bucket;
}

export interface Ad {
  id: string;
  advertiserSlug: string;
  advertiserName: string;
  advertiserLogo: string | null;
  advertiserPageUrl: string | null;
  websiteUrl: string | null;
  websiteDomain: string | null;
  copy: string;
  description: string | null;
  mediaUrl: string | null;
  publishedDate: string | null;
  impressions: number;
}

export interface Advertiser {
  slug: string;
  name: string;
  logo: string | null;
  websiteUrl: string | null;
  websiteDomain: string | null;
  adCount: number;
  totalImpressions: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAdsParams {
  q?: string;
  advertiser?: string;
  sort?: "date_desc" | "date_asc" | "impressions_desc" | "impressions_asc";
  page?: number;
  limit?: number;
  minImpressions?: number;
  maxImpressions?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListAdvertisersParams {
  q?: string;
  sort?: "name_asc" | "name_desc" | "ad_count_desc" | "impressions_desc";
  page?: number;
  limit?: number;
}
