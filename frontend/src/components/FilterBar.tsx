import { useEffect, useState, type ReactNode } from "react";
import type { AdSort } from "../types";
import AdvertiserSelect from "./AdvertiserSelect";

interface FilterBarProps {
  sort: AdSort;
  advertiser: string;
  minImpressions: string;
  maxImpressions: string;
  dateFrom: string;
  dateTo: string;
  hasFilters: boolean;
  onSortChange: (sort: AdSort) => void;
  onAdvertiserChange: (slug: string) => void;
  onImpressionsChange: (min: string, max: string) => void;
  onDateChange: (from: string, to: string) => void;
  onClear: () => void;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </span>
  );
}

export default function FilterBar({
  sort,
  advertiser,
  minImpressions,
  maxImpressions,
  dateFrom,
  dateTo,
  hasFilters,
  onSortChange,
  onAdvertiserChange,
  onImpressionsChange,
  onDateChange,
  onClear,
}: FilterBarProps) {
  const [minInput, setMinInput] = useState(minImpressions);
  const [maxInput, setMaxInput] = useState(maxImpressions);

  useEffect(() => {
    setMinInput(minImpressions);
  }, [minImpressions]);

  useEffect(() => {
    setMaxInput(maxImpressions);
  }, [maxImpressions]);

  function applyImpressions() {
    onImpressionsChange(minInput, maxInput);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Label>Sort by</Label>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as AdSort)}
            className={INPUT_CLASS}
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="impressions_desc">Most impressions</option>
            <option value="impressions_asc">Fewest impressions</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <Label>Advertiser</Label>
          <AdvertiserSelect value={advertiser} onChange={onAdvertiserChange} />
        </div>

        <div>
          <Label>Min impressions</Label>
          <input
            type="number"
            min={0}
            value={minInput}
            onChange={(event) => setMinInput(event.target.value)}
            onBlur={applyImpressions}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyImpressions();
            }}
            placeholder="0"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <Label>Max impressions</Label>
          <input
            type="number"
            min={0}
            value={maxInput}
            onChange={(event) => setMaxInput(event.target.value)}
            onBlur={applyImpressions}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyImpressions();
            }}
            placeholder="Any"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end dark:border-zinc-800">
        <div className="grid flex-1 grid-cols-2 gap-4">
          <div>
            <Label>From date</Label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => onDateChange(event.target.value, dateTo)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <Label>To date</Label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => onDateChange(dateFrom, event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
