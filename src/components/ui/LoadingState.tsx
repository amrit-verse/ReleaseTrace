"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
}

export function LoadingState({
  label = "Retrieving release telemetry...",
  sublabel,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="p-8 border border-surface-border rounded bg-surface/30 flex flex-col items-center justify-center text-center space-y-2.5"
    >
      <Loader2 className="w-5 h-5 text-signal animate-spin" />
      <div>
        <p className="text-xs font-mono font-medium text-text-primary">{label}</p>
        {sublabel && (
          <p className="text-[11px] font-mono text-text-muted mt-0.5">{sublabel}</p>
        )}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
