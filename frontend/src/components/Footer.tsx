import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            An independent, searchable archive of ads running across ChatGPT. Built for
            researchers, marketers, and the curious.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
          <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Ads
          </Link>
          <Link to="/advertisers" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Advertisers
          </Link>
          <Link to="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            About
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl px-4 text-xs text-zinc-400 dark:text-zinc-600 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} ChatGPT Ads Library. Not affiliated with OpenAI.
      </div>
    </footer>
  );
}
