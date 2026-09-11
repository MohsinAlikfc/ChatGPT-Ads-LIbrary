import { useEffect, useMemo, useRef, useState } from "react";
import { getAdvertisers } from "../lib/api";
import type { Advertiser } from "../types";

interface AdvertiserSelectProps {
  value: string;
  onChange: (slug: string) => void;
}

export default function AdvertiserSelect({ value, onChange }: AdvertiserSelectProps) {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getAdvertisers({ limit: 5000, sort: "name_asc" })
      .then((res) => {
        if (active) setAdvertisers(res.advertisers);
      })
      .catch(() => {
        if (active) setAdvertisers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return advertisers;
    return advertisers.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.websiteDomain?.toLowerCase().includes(term)
    );
  }, [advertisers, search]);

  const selected = advertisers.find((a) => a.slug === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch("");
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span className="truncate">{selected ? selected.name : "All advertisers"}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 p-2 dark:border-zinc-800">
            <input
              autoFocus
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search advertisers…"
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <ul className="scrollbar-thin max-h-56 overflow-y-auto p-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                All advertisers
              </button>
            </li>
            {filtered.map((advertiser) => (
              <li key={advertiser.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(advertiser.slug);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span className="truncate">{advertiser.name}</span>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {advertiser.adCount}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-zinc-400">No advertisers found</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
