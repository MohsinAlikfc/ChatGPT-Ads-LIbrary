CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  advertiser_slug TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  advertiser_logo TEXT,
  advertiser_page_url TEXT,
  website_url TEXT,
  website_domain TEXT,
  copy TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  media_url TEXT,
  published_date TEXT,
  impressions INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ads_advertiser_slug ON ads (advertiser_slug);
CREATE INDEX IF NOT EXISTS idx_ads_advertiser_name ON ads (advertiser_name);
CREATE INDEX IF NOT EXISTS idx_ads_website_domain ON ads (website_domain);
CREATE INDEX IF NOT EXISTS idx_ads_published_date ON ads (published_date);
CREATE INDEX IF NOT EXISTS idx_ads_impressions ON ads (impressions);

CREATE TABLE IF NOT EXISTS advertisers (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  website_url TEXT,
  website_domain TEXT,
  ad_count INTEGER NOT NULL DEFAULT 0,
  total_impressions INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT,
  last_seen TEXT
);

CREATE INDEX IF NOT EXISTS idx_advertisers_name ON advertisers (name);
CREATE INDEX IF NOT EXISTS idx_advertisers_ad_count ON advertisers (ad_count);
CREATE INDEX IF NOT EXISTS idx_advertisers_total_impressions ON advertisers (total_impressions);

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ad_count INTEGER NOT NULL DEFAULT 0,
  advertiser_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ad_categories (
  ad_id TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  PRIMARY KEY (ad_id, category_slug)
);
CREATE INDEX IF NOT EXISTS idx_ad_categories_slug ON ad_categories(category_slug);
CREATE INDEX IF NOT EXISTS idx_ad_categories_ad_id ON ad_categories(ad_id);
