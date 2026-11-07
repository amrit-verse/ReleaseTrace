import React from "react";

export default function LearningLabLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6 animate-in fade-in duration-150">
      <div className="space-y-2">
        <div className="h-7 w-60 rounded-lg liquid-skeleton" />
        <div className="h-4 w-96 rounded liquid-skeleton" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-2xl liquid-glass-card p-5" />
          <div className="h-48 rounded-2xl liquid-glass-card p-5" />
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-2xl liquid-glass-card p-5" />
          <div className="h-48 rounded-2xl liquid-glass-card p-5" />
        </div>
      </div>
    </div>
  );
}
