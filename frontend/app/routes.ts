import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("advertisers", "routes/advertisers._index.tsx"),
  route("advertisers/:slug", "routes/advertisers.$slug.tsx"),
  route("ads/:id", "routes/ads.$id.tsx"),
  route("about", "routes/about.tsx"),
  route("api/ads", "routes/api.ads.ts"),
  route("api/advertisers", "routes/api.advertisers.ts"),
  route("api/stats", "routes/api.stats.ts"),
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
