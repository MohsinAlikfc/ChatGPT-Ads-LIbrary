# ChatGPT Ads Library

> An independent, searchable archive of ads running across ChatGPT — built on Cloudflare's full stack.

[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Hono](https://img.shields.io/badge/Hono-4.6-E36002?logo=hono&logoColor=white)](https://hono.dev)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Local Development](#local-development)
- [API Reference](#api-reference)
- [🚀 Deploying to Cloudflare (Step-by-Step)](#-deploying-to-cloudflare-step-by-step)
  - [Prerequisites](#prerequisites)
  - [Step 1 — Authenticate with Cloudflare](#step-1--authenticate-with-cloudflare)
  - [Step 2 — Create the D1 Database](#step-2--create-the-d1-database)
  - [Step 3 — Seed the Remote Database](#step-3--seed-the-remote-database)
  - [Step 4 — Deploy the API Worker](#step-4--deploy-the-api-worker)
  - [Step 5 — Deploy the Frontend to Cloudflare Pages](#step-5--deploy-the-frontend-to-cloudflare-pages)
  - [Step 6 — Connect Your Custom Domain](#step-6--connect-your-custom-domain)
  - [Step 7 — (Optional) Self-host Images in R2](#step-7--optional-self-host-images-in-r2)
- [Environment Variables](#environment-variables)
- [CI / CD with GitHub Actions](#ci--cd-with-github-actions)
- [Regenerating Data](#regenerating-data)
- [Useful Scripts](#useful-scripts)
- [Disclaimer](#disclaimer)

---

## Overview

The ChatGPT Ads Library lets you browse and search every ad running inside ChatGPT — including ad creative, headline copy, advertiser profiles, publish dates, and impression counts. It is fully indexed for SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS | Website / UI |
| API | Cloudflare Workers + Hono | Search, filtering, sorting |
| Database | Cloudflare D1 (SQLite at the edge) | Ads + advertiser metadata |
| Image storage | Cloudflare R2 | Ad screenshots and logos _(optional)_ |
| CDN / Cache | Cloudflare global network | Low-latency delivery worldwide |
| Hosting | Cloudflare Pages | Static frontend with SPA routing |
| Domain / DNS | Cloudflare | `chatgpt-ads-library.com` |

---

## Repository Layout

```
chatgpt-ads-library/
├── api/                          # Cloudflare Worker (Hono + D1)
│   ├── src/
│   │   ├── index.ts              # Worker entry point
│   │   ├── routes.ts             # API route handlers
│   │   ├── db.ts                 # D1 query helpers
│   │   └── types.ts              # Shared types
│   ├── schema.sql                # D1 table schema
│   ├── seed.sql                  # Full schema + data seed (~3,157 ads)
│   └── wrangler.toml             # Worker / D1 / R2 config  ← edit this
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Route-level page components
│   │   ├── lib/                  # API client, schema helpers, utils
│   │   └── hooks/                # Custom React hooks
│   ├── public/
│   │   ├── _redirects            # SPA fallback for Cloudflare Pages
│   │   ├── robots.txt            # Crawl rules + AI bot directives
│   │   ├── sitemap.xml           # Full URL sitemap
│   │   └── llms.txt              # GEO content for AI engines
│   ├── .env.example              # Environment variable template
│   └── vite.config.ts            # Dev proxy: /api → localhost:8787
├── data/
│   ├── ads.json                  # Normalized ad records (3,157)
│   └── advertisers.json          # Derived advertiser records (1,359)
├── scripts/
│   ├── normalize.mjs             # Raw JSON → clean data files
│   ├── generate-seed.mjs         # data/ → api/seed.sql
│   └── generate-sitemap.mjs      # Generates public/sitemap.xml
└── package.json                  # Root workspace scripts
```

---

## Local Development

**Prerequisites:** Node.js ≥ 18 (`.nvmrc` pins 22). A Cloudflare account is only needed for D1/Worker commands — the local dev server uses a local D1 SQLite file automatically.

```bash
# 1. Clone the repo
git clone https://github.com/your-username/ChatGPT-Ads-Library.git
cd ChatGPT-Ads-Library

# 2. Install all workspace dependencies (api + frontend)
npm install

# 3. Seed the local D1 database (creates tables + inserts all data)
npm run seed:local

# 4. Run the API worker and frontend together
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| API Worker (Wrangler) | http://localhost:8787 |

The Vite dev server proxies all `/api/*` requests to the local Worker on port 8787, so the frontend connects to the API automatically — no `.env` file needed for local development.

---

## API Reference

All endpoints return JSON and are read-only.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/stats` | Totals, date range, top advertisers |
| `GET` | `/api/ads` | List / search / filter all ads |
| `GET` | `/api/ads/:id` | Single ad detail |
| `GET` | `/api/advertisers` | List / search advertisers |
| `GET` | `/api/advertisers/:slug` | Advertiser detail + their ads |

### `/api/ads` Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | `string` | — | Full-text search across advertiser, domain, copy, description |
| `advertiser` | `string` | — | Filter by advertiser slug |
| `sort` | `string` | `date_desc` | `date_desc`, `date_asc`, `impressions_desc`, `impressions_asc` |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `24` | Page size (max 100) |
| `min_impressions` | `number` | — | Minimum impression count |
| `max_impressions` | `number` | — | Maximum impression count |
| `date_from` | `string` | — | Start date `YYYY-MM-DD` |
| `date_to` | `string` | — | End date `YYYY-MM-DD` |

**Example:**
```
GET /api/ads?q=ezoic&sort=impressions_desc&min_impressions=50&page=1&limit=24
```

### `/api/advertisers` Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | `string` | — | Search by name or domain |
| `sort` | `string` | `ad_count_desc` | `ad_count_desc`, `impressions_desc`, `name_asc`, `name_desc` |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `60` | Page size (max 5000) |

---

## 🚀 Deploying to Cloudflare (Step-by-Step)

This project is built entirely for Cloudflare's free and low-cost tiers — no external servers needed.

```
GitHub repo
    │
    ├─► Cloudflare Workers ──► D1 Database  (API)
    │                     └──► R2 Bucket    (Images, optional)
    │
    └─► Cloudflare Pages                    (Frontend)
             └──► Custom Domain (DNS on Cloudflare)
```

---

### Prerequisites

1. **Cloudflare account** — [sign up free](https://dash.cloudflare.com/sign-up)
2. **Node.js 18+** installed locally
3. **Wrangler CLI** — installed as a dev dependency, use `npx wrangler` or install globally:
   ```bash
   npm install -g wrangler
   ```

---

### Step 1 — Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser window. Log in with your Cloudflare account and authorize Wrangler. Your credentials are stored locally in `~/.wrangler/config`.

Verify it worked:
```bash
npx wrangler whoami
```

---

### Step 2 — Create the D1 Database

```bash
cd api
npx wrangler d1 create chatgpt-ads-library
```

You'll see output like:

```
✅ Successfully created DB 'chatgpt-ads-library'

[[d1_databases]]
binding = "DB"
database_name = "chatgpt-ads-library"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   ← copy this
```

**Open `api/wrangler.toml` and paste the real `database_id`:**

```toml
[[d1_databases]]
binding = "DB"
database_name = "chatgpt-ads-library"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # ← replace placeholder
```

> [!IMPORTANT]
> Without the correct `database_id`, the Worker cannot connect to D1 and all API calls will fail.

---

### Step 3 — Seed the Remote Database

This imports the schema and all ~3,157 ad records into your live D1 database.

```bash
# From the api/ directory
npx wrangler d1 execute chatgpt-ads-library --remote --file=./seed.sql
```

Or from the root using the workspace script:

```bash
npm run seed:remote
```

> [!NOTE]
> The `seed.sql` file is ~3.4 MB. It contains both the `CREATE TABLE` statements and all `INSERT` data — you only need to run this once. If you run it again, it uses `INSERT OR REPLACE` so no duplicates are created.

Verify the data landed:
```bash
npx wrangler d1 execute chatgpt-ads-library --remote --command="SELECT COUNT(*) FROM ads"
```

---

### Step 4 — Deploy the API Worker

```bash
cd api
npm run deploy
```

This runs `wrangler deploy` and publishes the Worker to Cloudflare's global edge network. You'll see output like:

```
✅ Deployed chatgpt-ads-library-api
   https://chatgpt-ads-library-api.<your-subdomain>.workers.dev
```

**Save that Worker URL** — you'll need it in Step 5 if the API and frontend are on different origins.

Test the live API:
```bash
curl https://chatgpt-ads-library-api.<your-subdomain>.workers.dev/api/health
curl https://chatgpt-ads-library-api.<your-subdomain>.workers.dev/api/stats
```

---

### Step 5 — Deploy the Frontend to Cloudflare Pages

You have two options: **via the Cloudflare dashboard** (recommended for first-time) or **via Wrangler CLI**.

---

#### Option A — Cloudflare Dashboard (Git-connected, auto-deploys)

This is the recommended approach. Every push to `main` will auto-deploy.

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. Click **Create application → Pages → Connect to Git**
3. Authorize GitHub and select your **ChatGPT-Ads-Library** repository
4. Configure the build settings:

   | Setting | Value |
   |---------|-------|
   | **Framework preset** | `None` (or `Vite`) |
   | **Build command** | `npm run build -w frontend` |
   | **Build output directory** | `frontend/dist` |
   | **Root directory** | `/` _(leave as repo root)_ |
   | **Node.js version** | `18` or `22` |

5. Add the environment variable _(only if API is on a different domain from Pages)_:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://chatgpt-ads-library-api.<your-subdomain>.workers.dev` |

   > [!TIP]
   > If you later add a custom domain and route `/api/*` to your Worker (see Step 6), you can remove `VITE_API_URL` entirely and the frontend will call `/api` on the same origin.

6. Click **Save and Deploy**. Cloudflare builds and deploys — usually in under 60 seconds.

Your site will be live at `https://<your-project>.pages.dev`.

---

#### Option B — Wrangler CLI (Direct upload)

```bash
# Build the frontend
cd frontend
npm run build

# Deploy the dist/ folder to Pages
npx wrangler pages deploy dist --project-name=chatgpt-ads-library
```

On the first run you'll be prompted to create a new Pages project. Subsequent runs update the existing project.

---

### Step 6 — Connect Your Custom Domain

#### Add your domain to Cloudflare DNS

If your domain isn't already on Cloudflare:
1. Go to [Cloudflare Dashboard → Add a site](https://dash.cloudflare.com/)
2. Enter your domain (e.g. `chatgpt-ads-library.com`)
3. Follow the steps to update your registrar's nameservers to Cloudflare's

#### Attach the domain to Cloudflare Pages

1. In your Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `chatgpt-ads-library.com` (and optionally `www.chatgpt-ads-library.com`)
3. Cloudflare automatically creates the DNS records and provisions a free SSL certificate

#### (Optional) Route `/api/*` to the Worker on the same domain

Instead of a separate `workers.dev` subdomain for the API, you can serve everything from one domain using a Worker Route. This lets the frontend call `/api` without setting `VITE_API_URL`.

1. Go to **Workers & Pages → your Worker → Triggers → Add route**
2. Add the route: `chatgpt-ads-library.com/api/*`
3. Select **Zone:** `chatgpt-ads-library.com`
4. Remove `VITE_API_URL` from your Pages environment variables (or set it to empty)
5. Redeploy Pages to pick up the change

Now `https://chatgpt-ads-library.com/api/*` hits the Worker, and everything else serves from Pages.

---

### Step 7 — (Optional) Self-host Images in R2

The seed data references ad screenshots hosted on the original source's Supabase storage, so **the site works without R2 from day one**. Set up R2 only if you want full image independence.

#### Create the R2 bucket

```bash
npx wrangler r2 bucket create chatgpt-ads-library-images
```

Update `api/wrangler.toml` with the exact bucket name:

```toml
[[r2_buckets]]
binding = "ADS_IMAGES"
bucket_name = "chatgpt-ads-library-images"
```

#### Upload images

Download each image URL from `data/ads.json` (`media_url` and `advertiser_logo` fields) and upload them to R2:

```bash
# Example: upload a single file
npx wrangler r2 object put chatgpt-ads-library-images/ads/abc123.webp --file=./abc123.webp
```

For bulk migration, write a small script that:
1. Reads `data/ads.json`
2. Downloads each `media_url` 
3. Uploads it to R2 with a consistent key
4. Updates the URL in the data file

Then re-seed:
```bash
npm run seed:generate   # regenerate seed.sql from updated data/
npm run seed:remote     # push to D1
```

The `ADS_IMAGES` binding is already wired into the Worker as `c.env.ADS_IMAGES`.

---

## Environment Variables

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env` for local overrides.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `""` (same origin) | Full URL of the API Worker if on a different domain |
| `VITE_SITE_URL` | No | `https://chatgpt-ads-library.com` | Canonical site URL used in SEO tags and JSON-LD |

### In Cloudflare Pages Dashboard

Set these under **Settings → Environment variables**:

| Variable | Production value |
|----------|-----------------|
| `VITE_API_URL` | `https://chatgpt-ads-library-api.<subdomain>.workers.dev` _(omit if using Worker route)_ |
| `VITE_SITE_URL` | `https://your-domain.com` |

> [!NOTE]
> Variables prefixed with `VITE_` are embedded into the JavaScript bundle at build time. They are **not secret** — do not put API keys here.

---

## CI / CD with GitHub Actions

If you prefer GitHub Actions over Cloudflare's built-in Git integration, add this workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    name: Deploy API Worker
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Deploy Worker
        run: npm run deploy -w api
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-frontend:
    name: Deploy Frontend to Pages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Build frontend
        run: npm run build -w frontend
        env:
          VITE_SITE_URL: https://chatgpt-ads-library.com
      - name: Publish to Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/dist --project-name=chatgpt-ads-library
```

**Required GitHub secrets:**

| Secret | Where to get it |
|--------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → right sidebar on any page |

---

## Regenerating Data

If you update the raw source JSON (`supaintent-*.json`):

```bash
# 1. Normalize raw data → data/ads.json + data/advertisers.json
node scripts/normalize.mjs

# 2. Generate the SQL seed file
npm run seed:generate       # → api/seed.sql

# 3. Regenerate the sitemap
npm run sitemap:generate    # → frontend/public/sitemap.xml

# 4. Push to local or remote D1
npm run seed:local          # local dev
npm run seed:remote         # production
```

---

## Useful Scripts

Run these from the **repo root** unless noted.

| Script | Description |
|--------|-------------|
| `npm run dev` | Run API worker + frontend concurrently |
| `npm run build` | Build both worker and frontend |
| `npm run typecheck` | TypeScript check across all workspaces |
| `npm run seed:local` | Seed local D1 database |
| `npm run seed:remote` | Seed remote D1 database |
| `npm run seed:generate` | Regenerate `api/seed.sql` from `data/` |
| `npm run sitemap:generate` | Regenerate `frontend/public/sitemap.xml` |
| `npm run deploy` _(api/)_ | Deploy Worker to Cloudflare |

---

## Disclaimer

This is an independent project and is not affiliated with or endorsed by OpenAI. Ad data may be incomplete or change over time.
