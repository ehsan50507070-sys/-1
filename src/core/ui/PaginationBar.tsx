// Reusable Lightweight RTL Pagination Bar & Hook (Persian Digits, Tabular Numerals, Light/Dark Compatible)
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toPersianDigits } from '../../lib/digits';

export interface PaginationBarProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextSize: number) => void;
  pageSizeOptions?: readonly number[];
  itemLabelFa?: string;
  className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100];

export function usePagination<T>(items: readonly T[], initialPageSize = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  return {
    currentPage: safePage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    resetPage: () => setCurrentPage(1),
  };
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  itemLabelFa = 'مورد',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalItems === 0) return null;

  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, safePage * pageSize);

  return (
    <div
      dir="rtl"
      data-testid="pagination-bar"
      className={`no-print flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs ${className}`}
    >
      {/* Right (RTL start): Summary & Total Count */}
      <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300 tabular-nums">
        <span>
          نمایش <strong className="text-slate-900 dark:text-white">{toPersianDigits(startIdx)}</strong> تا{' '}
          <strong className="text-slate-900 dark:text-white">{toPersianDigits(endIdx)}</strong> از{' '}
          <strong className="text-slate-900 dark:text-white">{toPersianDigits(totalItems)}</strong> {itemLabelFa}
        </span>
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
          ·
        </span>
        <span>
          صفحه <strong className="text-slate-900 dark:text-white">{toPersianDigits(safePage)}</strong> از{' '}
          <strong className="text-slate-900 dark:text-white">{toPersianDigits(totalPages)}</strong>
        </span>
      </div>

      {/* Left (RTL end): Page Size Selector + Prev / Next Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline whitespace-nowrap">تعداد در صفحه:</span>
            <select
              aria-label="تعداد ردیف در هر صفحه"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {toPersianDigits(opt)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            aria-label="صفحه قبلی"
            className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span>قبلی</span>
          </button>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            aria-label="صفحه بعدی"
            className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>بعدی</span>
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
