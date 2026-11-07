import React from "react";

export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6 animate-in fade-in duration-150">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg liquid-skeleton" />
        <div className="h-4 w-96 rounded liquid-skeleton" />
      </div>

      <div className="space-y-4 max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-2xl liquid-glass-card space-y-4">
            <div className="h-5 w-40 rounded liquid-skeleton" />
            <div className="h-4 w-72 rounded liquid-skeleton" />
            <div className="h-10 w-full rounded-lg liquid-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
