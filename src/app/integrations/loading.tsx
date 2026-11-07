import React from "react";

export default function IntegrationsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6 animate-in fade-in duration-150">
      <div className="space-y-2">
        <div className="h-7 w-60 rounded-lg liquid-skeleton" />
        <div className="h-4 w-96 rounded liquid-skeleton" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 rounded-2xl liquid-glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 rounded liquid-skeleton" />
              <div className="h-5 w-16 rounded-full liquid-skeleton" />
            </div>
            <div className="h-10 w-full rounded liquid-skeleton" />
            <div className="h-4 w-28 rounded liquid-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
