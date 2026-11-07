import React from "react";

export default function DeploymentsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6 animate-in fade-in duration-150">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 rounded-lg liquid-skeleton" />
          <div className="h-8 w-24 rounded-lg liquid-skeleton" />
        </div>
        <div className="h-4 w-80 rounded liquid-skeleton" />
      </div>

      <div className="rounded-xl border border-surface-border bg-surface p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="h-10 rounded-lg liquid-skeleton" />
          <div className="h-10 rounded-lg liquid-skeleton" />
          <div className="h-10 rounded-lg liquid-skeleton" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface shadow-panel-subtle divide-y divide-surface-border">
        <div className="flex items-center justify-between p-4">
          <div className="h-5 w-32 rounded liquid-skeleton" />
          <div className="h-4 w-24 rounded liquid-skeleton" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full liquid-skeleton" />
                <div className="h-5 w-20 rounded-full liquid-skeleton" />
                <div className="h-3 w-32 rounded liquid-skeleton" />
              </div>
              <div className="h-4 w-44 rounded liquid-skeleton" />
              <div className="h-3 w-36 rounded liquid-skeleton" />
            </div>
            <div className="h-9 w-24 rounded-lg liquid-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
