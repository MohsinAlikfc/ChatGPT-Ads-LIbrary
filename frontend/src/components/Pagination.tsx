import { type MouseEvent } from "react";
import type { Pagination as PaginationMeta } from "../types";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Required for SEO: builds a URL for a given page number so pagination renders real <a> tags */
  buildPageUrl: (page: number) => string;
}

function pageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function Pagination({ pagination, onPageChange, buildPageUrl }: PaginationProps) {
  const { page, totalPages, total, limit } = pagination;

  if (totalPages <= 1) return null;

  /** Intercepts anchor clicks for SPA navigation while keeping real hrefs for crawlers */
  function handleClick(event: MouseEvent<HTMLAnchorElement>, targetPage: number) {
    if (targetPage === page || targetPage < 1 || targetPage > totalPages) return;
    event.preventDefault();
    onPageChange(targetPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const firstItem = (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination navigation"
      className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 sm:flex-row dark:border-zinc-800"
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{firstItem}</span>–
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{lastItem}</span> of{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{total}</span>
      </p>

      <ol className="flex items-center gap-1 list-none" role="list">
        {/* Previous */}
        <li>
          <a
            href={page > 1 ? buildPageUrl(page - 1) : undefined}
            onClick={(e) => handleClick(e, page - 1)}
            aria-label="Go to previous page"
            aria-disabled={page <= 1}
            rel={page > 1 ? "prev" : undefined}
            className={`inline-flex items-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 ${
              page <= 1 ? "cursor-not-allowed opacity-40 pointer-events-none" : ""
            }`}
          >
            Previous
          </a>
        </li>

        {/* Page numbers */}
        {pageNumbers(page, totalPages).map((item, index) =>
          item === "..." ? (
            <li key={`ellipsis-${index}`} aria-hidden="true">
              <span className="px-2 text-sm text-zinc-400">…</span>
            </li>
          ) : (
            <li key={item}>
              <a
                href={buildPageUrl(item)}
                onClick={(e) => handleClick(e, item)}
                aria-label={item === page ? `Current page, page ${item}` : `Go to page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                  item === page
                    ? "bg-brand-500 text-white pointer-events-none"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {item}
              </a>
            </li>
          )
        )}

        {/* Next */}
        <li>
          <a
            href={page < totalPages ? buildPageUrl(page + 1) : undefined}
            onClick={(e) => handleClick(e, page + 1)}
            aria-label="Go to next page"
            aria-disabled={page >= totalPages}
            rel={page < totalPages ? "next" : undefined}
            className={`inline-flex items-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 ${
              page >= totalPages ? "cursor-not-allowed opacity-40 pointer-events-none" : ""
            }`}
          >
            Next
          </a>
        </li>
      </ol>
    </nav>
  );
}
