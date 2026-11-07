import React from "react";

export default function MemoriesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6 animate-in fade-in duration-150">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-7 w-56 rounded-lg liquid-skeleton" />
          <div className="h-9 w-32 rounded-lg liquid-skeleton" />
        </div>
        <div className="h-4 w-96 rounded liquid-skeleton" />
      </div>

      <div className="rounded-xl border border-surface-border bg-surface p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="h-10 rounded-lg liquid-skeleton" />
          <div className="h-10 rounded-lg liquid-skeleton" />
          <div className="h-10 rounded-lg liquid-skeleton" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl liquid-glass-card space-y-3 h-52">
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 rounded-full liquid-skeleton" />
              <div className="h-4 w-28 rounded liquid-skeleton" />
            </div>
            <div className="h-6 w-3/4 rounded-lg liquid-skeleton" />
            <div className="h-12 w-full rounded liquid-skeleton" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-32 rounded liquid-skeleton" />
              <div className="h-4 w-20 rounded liquid-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
