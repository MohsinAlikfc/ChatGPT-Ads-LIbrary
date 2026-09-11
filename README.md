# ChatGPT Ads Library

A searchable, filterable archive of ads running across ChatGPT. The site lets visitors
browse ad creative, explore advertisers, and search by advertiser, website, ad copy, date
range, and impressions.

## Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript + Tailwind | Website/UI |
| Backend/API | Cloudflare Workers + Hono | Search, filtering, sorting |
| Database | Cloudflare D1 | Ads + advertiser metadata |
| Image/file storage | Cloudflare R2 | Ad screenshots and logos (optional at first) |
| CDN/cache | Cloudflare CDN | Global delivery |
| Domain/DNS | Cloudflare | `chatgpt-ads-library.com` |

## Repository layout

```
.
├── api/                     # Cloudflare Worker (Hono + D1)
│   ├── src/
│   │   ├── index.ts         # Worker entry point
│   │   ├── routes.ts        # API routes
│   │   ├── db.ts            # D1 queries
│   │   └── types.ts         # Shared types
│   ├── schema.sql           # D1 schema (also embedded in seed.sql)
│   ├── seed.sql             # Self-contained schema + data seed
│   └── wrangler.toml        # Worker, D1, and R2 config
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Routes
│   │   ├── lib/             # API client + helpers
│   │   └── hooks/
│   └── public/_redirects    # SPA fallback for Cloudflare Pages
├── data/
│   ├── ads.json             # Normalized ads (3,157 records)
│   └── advertisers.json     # Derived advertisers (1,359 records)
├── scripts/
│   ├── normalize.mjs        # Raw JSON -> clean data files
│   └── generate-seed.mjs    # Data files -> api/seed.sql
└── supaintent-2026-09-04.json  # Raw source data
```

## Local development

Prerequisites: Node.js 18+ (`.nvmrc` pins 22) and a Cloudflare account for the
`wrangler` CLI (only needed for D1/Worker commands).

```bash
# 1. Install all workspace dependencies
npm install

# 2. (Optional) Regenerate the seed from the source data
npm run seed:generate

# 3. Seed the local D1 database (creates tables + inserts data)
npm run seed:local

# 4. Run the API worker and frontend together
npm run dev
```

- Frontend: http://localhost:5173
- API worker: http://localhost:8787

The Vite dev server proxies `/api/*` to the Worker, so the frontend talks to the local
API automatically.

Useful scripts:

```bash
npm run dev            # run worker + frontend concurrently
npm run build          # build worker + frontend
npm run typecheck      # typecheck both workspaces
npm run seed:local     # seed local D1
npm run seed:remote    # seed remote D1 (after configuring database_id)
```

## API

Base URL is the Worker origin (e.g. `http://localhost:8787` locally). All endpoints are
read-only JSON.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Totals, date range, top advertisers |
| GET | `/api/ads` | List/search/filter ads |
| GET | `/api/ads/:id` | Single ad |
| GET | `/api/advertisers` | List/search advertisers |
| GET | `/api/advertisers/:slug` | Advertiser detail + their ads |

### `/api/ads` query parameters

- `q` — full-text search across advertiser name, website domain, copy, and description
- `advertiser` — advertiser slug
- `sort` — `date_desc` (default), `date_asc`, `impressions_desc`, `impressions_asc`
- `page` — page number (default `1`)
- `limit` — page size (default `24`, max `100`)
- `min_impressions` / `max_impressions` — impression range
- `date_from` / `date_to` — published date range (`YYYY-MM-DD`)

Example:

```
GET /api/ads?q=ezoic&sort=impressions_desc&min_impressions=50&page=1&limit=24
```

### `/api/advertisers` query parameters

- `q` — search by name or website domain
- `sort` — `ad_count_desc` (default), `impressions_desc`, `name_asc`, `name_desc`
- `page`, `limit` — pagination (default `60` per page, max `5000`)

## Deployment to Cloudflare

### 1. Create the D1 database

```bash
cd api
npx wrangler d1 create chatgpt-ads-library
```

Copy the returned `database_id` into `api/wrangler.toml` (replace the placeholder
`00000000-0000-0000-0000-000000000000`).

### 2. Seed the remote database

```bash
cd api
npx wrangler d1 execute chatgpt-ads-library --remote --file=./seed.sql
```

### 3. Deploy the Worker

```bash
cd api
npm run deploy
```

### 4. Deploy the frontend to Cloudflare Pages

Build the frontend and upload the `frontend/dist` directory:

```bash
cd frontend
npm run build
```

In the Cloudflare Pages dashboard, connect the repo with:

- Build command: `npm run build -w frontend`
- Output directory: `frontend/dist`

The included `frontend/public/_redirects` handles client-side routing.

If the API is deployed to a different origin than the Pages site, set
`VITE_API_URL` (see `frontend/.env.example`) at build time:

```bash
cd frontend
VITE_API_URL=https://chatgpt-ads-library-api.<your-subdomain>.workers.dev npm run build
```

### 5. Point the domain

Add `chatgpt-ads-library.com` as a custom domain on Cloudflare Pages (or a custom Worker
route) following the Cloudflare dashboard prompts.

## Image storage note

The current data references ad screenshots and logos hosted on an external origin
(the original source's Supabase storage), so the site works immediately without R2.

To self-host the images:

1. Create the R2 bucket: `npx wrangler r2 bucket create chatgpt-ads-library-images`
2. Download each `media_url` / `advertiser_logo` and upload it to R2
3. Update the URLs in `data/ads.json` (and re-run `npm run seed:generate` +
   `npm run seed:remote`), or add an image-proxy/rewrite layer

The `ADS_IMAGES` binding is already wired into the Worker and available as
`c.env.ADS_IMAGES` when you're ready to use it.

## Regenerating the data

If the raw source JSON changes:

```bash
node scripts/normalize.mjs     # raw -> data/ads.json + data/advertisers.json
npm run seed:generate          # data -> api/seed.sql
npm run seed:local             # or seed:remote
```

## Disclaimer

This is an independent project and is not affiliated with or endorsed by OpenAI. Ad data
may be incomplete or change over time.
