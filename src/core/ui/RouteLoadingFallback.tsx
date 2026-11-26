// Minimalist RTL Suspense Fallback for Lazy-Loaded Route Chunks
import React from 'react';
import { Loader2 } from 'lucide-react';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      className="min-h-[280px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center"
    >
      <Loader2 className="w-6 h-6 brand-text animate-spin motion-reduce:animate-none" />
      <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
        در حال بارگذاری...
      </p>
    </div>
  );
};
