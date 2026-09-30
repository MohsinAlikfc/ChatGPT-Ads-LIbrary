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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Contact Info */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              An independent, searchable archive of advertisements running across ChatGPT. Built for
              researchers, marketers, and the curious.
            </p>

            {/* Direct Contact Info */}
            <div className="mt-4 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-200">Email: </span>
                <a
                  href="mailto:contact@chatgpt-ads-library.com"
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  contact@chatgpt-ads-library.com
                </a>
              </div>
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-200">Phone: </span>
                <a
                  href="tel:+18005550199"
                  className="text-zinc-700 hover:underline dark:text-zinc-300"
                >
                  +1 (800) 555-0199
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-4 flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
              <a
                href="https://x.com/chatgptadslib"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                aria-label="Follow ChatGPT Ads Library on X (Twitter)"
                title="X / Twitter"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/MohsinAlikfc/ChatGPT-Ads-LIbrary"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                aria-label="ChatGPT Ads Library on GitHub"
                title="GitHub"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/chatgpt-ads-library"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                aria-label="ChatGPT Ads Library on LinkedIn"
                title="LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>

            {/* DMCA Badge */}
            <div className="mt-4 flex items-center gap-3">
              <Link
                to="/dmca"
                className="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                title="DMCA Protection Status"
              >
                <span className="rounded bg-blue-600 px-1 py-0.2 text-[9px] font-bold text-white">DMCA</span>
                <span>PROTECTED</span>
              </Link>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Updated Daily</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Archive
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
                <Link to="/sitemap" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  HTML Sitemap
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

          {/* Trust, Legal & Standards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Trust &amp; Legal
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link to="/privacy" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/team" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  Editorial Team &amp; Authors
                </Link>
              </li>
              <li>
                <Link to="/editorial-guidelines" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  Editorial Guidelines
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                  DMCA Notice
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Advertisers */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Top Advertisers
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              {FEATURED_ADVERTISERS.slice(0, 8).map((adv) => (
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
          © {new Date().getFullYear()} ChatGPT Ads Library. Open Transparency Project. Not affiliated with, authorized, or endorsed by OpenAI.
        </div>
      </div>
    </footer>
  );
}
