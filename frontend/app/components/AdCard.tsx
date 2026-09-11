import { Link } from "react-router";
import type { Ad } from "../types";
import { formatDate, formatNumber } from "../lib/utils";
import AdvertiserLogo from "./AdvertiserLogo";

export default function AdCard({ ad }: { ad: Ad }) {
  return (
    <Link
      to={`/ads/${ad.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {ad.mediaUrl ? (
          <img
            src={ad.mediaUrl}
            alt={ad.copy}
            loading="lazy"
            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
            No image
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          {formatNumber(ad.impressions)} impressions
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2">
          <AdvertiserLogo src={ad.advertiserLogo} name={ad.advertiserName} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {ad.advertiserName}
          </span>
          {ad.websiteDomain ? (
            <span className="shrink-0 truncate text-xs text-zinc-400 dark:text-zinc-500">
              {ad.websiteDomain}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {ad.copy}
        </h3>

        {ad.description ? (
          <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {ad.description}
          </p>
        ) : null}

        <div className="mt-auto pt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {formatDate(ad.publishedDate)}
        </div>
      </div>
    </Link>
  );
}
