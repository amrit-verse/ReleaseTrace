import React from "react";

export default function RootLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      <div className="flex flex-col gap-2 pt-2">
        <div className="h-4 w-32 rounded-full liquid-skeleton" />
        <div className="h-8 w-64 rounded-lg liquid-skeleton" />
        <div className="h-4 w-96 rounded liquid-skeleton" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl liquid-glass-card p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-16 rounded liquid-skeleton" />
              <div className="w-6 h-6 rounded liquid-skeleton" />
            </div>
            <div className="h-7 w-20 rounded liquid-skeleton" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-2xl liquid-glass-card p-6 space-y-4">
        <div className="h-6 w-1/2 rounded liquid-skeleton" />
        <div className="h-20 rounded-xl liquid-skeleton" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-xl liquid-skeleton" />
          <div className="h-20 rounded-xl liquid-skeleton" />
          <div className="h-20 rounded-xl liquid-skeleton" />
        </div>
      </div>
    </div>
  );
}
