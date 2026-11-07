import React from "react";

export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* Top Header Skeleton */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 rounded-full liquid-skeleton" />
          <div className="h-6 w-28 rounded-full liquid-skeleton" />
        </div>
        <div className="h-8 w-72 rounded-lg liquid-skeleton" />
        <div className="h-4 w-96 rounded liquid-skeleton" />
        <div className="flex items-center gap-2.5 mt-2">
          <div className="h-9 w-48 rounded-full liquid-skeleton" />
          <div className="h-9 w-44 rounded-full liquid-skeleton" />
          <div className="h-9 w-32 rounded-full liquid-skeleton" />
        </div>
      </div>

      {/* 4 Core Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-4 rounded-2xl liquid-glass-card shadow-sm h-32"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded liquid-skeleton" />
              <div className="w-8 h-8 rounded-xl liquid-skeleton" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <div className="h-8 w-12 rounded liquid-skeleton" />
              <div className="h-4 w-14 rounded-full liquid-skeleton" />
            </div>
            <div className="h-3 w-36 rounded liquid-skeleton" />
          </div>
        ))}
      </div>

      {/* Critical Interception Hero Skeleton */}
      <div className="flex flex-col rounded-2xl liquid-glass-card p-5 relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-52 rounded-full liquid-skeleton" />
          <div className="h-6 w-24 rounded-full liquid-skeleton" />
        </div>
        <div className="h-6 w-3/4 rounded-lg liquid-skeleton" />
        <div className="h-14 rounded-xl liquid-skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-28 rounded-xl liquid-skeleton" />
          <div className="h-28 rounded-xl liquid-skeleton" />
          <div className="h-28 rounded-xl liquid-skeleton" />
        </div>
      </div>

      {/* Pressure Matrix Skeleton */}
      <div className="p-5 rounded-2xl liquid-glass-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 rounded liquid-skeleton" />
          <div className="h-3 w-32 rounded liquid-skeleton" />
        </div>
        <div className="h-24 rounded-xl liquid-skeleton" />
      </div>
    </div>
  );
}
