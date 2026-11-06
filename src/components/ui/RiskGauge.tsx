import React from "react";
import { RiskClassification } from "@/types";
import { RiskBadge } from "./StatusBadge";

interface RiskGaugeProps {
  score: number; // 0 - 100
  classification: RiskClassification;
  showDetails?: boolean;
}

export function RiskGauge({ score, classification, showDetails = true }: RiskGaugeProps) {
  // Determine color theme based on score
  const getColor = (s: number) => {
    if (s >= 85) return "text-red-500 bg-red-500";
    if (s >= 65) return "text-orange-500 bg-orange-500";
    if (s >= 40) return "text-amber-500 bg-amber-500";
    return "text-emerald-500 bg-emerald-500";
  };

  const colorClass = getColor(score);
  const textColor = colorClass.split(" ")[0];
  const bgColor = colorClass.split(" ")[1];

  // 10-step segmented bar
  const segments = Array.from({ length: 10 }, (_, i) => i * 10);

  return (
    <div className="bg-surface-subtle border border-surface-border rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400 uppercase tracking-wider">
          Risk Assessment Index
        </span>
        <RiskBadge classification={classification} size="sm" />
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <span className={`text-3xl font-bold tracking-tight ${textColor}`}>
          {score}
        </span>
        <span className="text-zinc-500 text-sm">/ 100</span>
      </div>

      {/* Technical Segmented Meter */}
      <div className="grid grid-cols-10 gap-1 my-3" aria-label={`Risk score ${score} out of 100`}>
        {segments.map((segThreshold, idx) => {
          const isActive = score > segThreshold;
          return (
            <div
              key={idx}
              className={`h-2 rounded-xs transition-all ${
                isActive
                  ? idx >= 8
                    ? "bg-red-500"
                    : idx >= 6
                    ? "bg-orange-500"
                    : idx >= 4
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                  : "bg-zinc-800/80"
              }`}
            />
          );
        })}
      </div>

      {showDetails && (
        <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-surface-border/50">
          <span>0 (SAFE)</span>
          <span>THRESHOLD: 70</span>
          <span>100 (CRITICAL)</span>
        </div>
      )}
    </div>
  );
}
