import { Link } from "react-router";
import Logo from "./Logo";

const FEATURED_ADVERTISERS = [
  { name: "Ezoic Inc", slug: "ezoic-inc" },
  { name: "Criteo", slug: "criteo" },
  { name: "ZoomInfo", slug: "zoominfo-technologies-inc" },
  { name: "On Running", slug: "on" },
  { name: "OpenAI", slug: "openai" },
  { name: "OneTrust", slug: "onetrust" },
  { name: "Hilltop Ads", slug: "hilltop-ads-ltd" },
  { name: "Ai Media Group", slug: "ai-media-group" },
  { name: "JumpFly", slug: "jumpfly" },
  { name: "Asana", slug: "asana" },
  { name: "Clickguard", slug: "clickguard" },
  { name: "Gravity", slug: "gravity" },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              An independent, searchable archive of advertisements running across ChatGPT. Built for
              researchers, marketers, and the curious.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
              <span>Updated daily</span>
              <span>·</span>
              <span>100% Server Rendered</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Navigation
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link to="/" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  Ads Archive
                </Link>
              </li>
              <li>
                <Link
                  to="/advertisers"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  All Advertisers
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  About & FAQs
                </Link>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  XML Sitemap
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Top Advertisers
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-2 gap-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              {FEATURED_ADVERTISERS.map((adv) => (
                <li key={adv.slug}>
                  <Link
                    to={`/advertisers/${adv.slug}`}
                    className="truncate block transition hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {adv.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-100 pt-6 text-xs text-zinc-400 dark:border-zinc-900 dark:text-zinc-600">
          © {new Date().getFullYear()} ChatGPT Ads Library. Independent project. Not affiliated with
          or endorsed by OpenAI.
        </div>
      </div>
    </footer>
  );
}
