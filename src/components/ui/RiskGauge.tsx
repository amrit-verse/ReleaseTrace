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
    if (s >= 85) return "text-risk-critical bg-risk-critical";
    if (s >= 65) return "text-risk-warning bg-risk-warning";
    if (s >= 40) return "text-risk-elevated bg-risk-elevated";
    return "text-sage bg-sage";
  };

  const colorClass = getColor(score);
  const textColor = colorClass.split(" ")[0];

  // 10-step segmented bar
  const segments = Array.from({ length: 10 }, (_, i) => i * 10);

  return (
    <div className="bg-surface border border-surface-border rounded p-4 font-mono shadow-panel">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted uppercase tracking-wider">
          Risk Assessment Index
        </span>
        <RiskBadge classification={classification} size="sm" />
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <span className={`text-3xl font-bold tracking-tight ${textColor}`}>
          {score}
        </span>
        <span className="text-text-muted text-sm">/ 100</span>
      </div>

      {/* Technical Segmented Meter */}
      <div className="grid grid-cols-10 gap-1 my-3" aria-label={`Risk score ${score} out of 100`}>
        {segments.map((segThreshold, idx) => {
          const isActive = score > segThreshold;
          return (
            <div
              key={idx}
              className={`h-2 rounded-[2px] transition-all ${
                isActive
                  ? idx >= 8
                    ? "bg-risk-critical"
                    : idx >= 6
                    ? "bg-risk-warning"
                    : idx >= 4
                    ? "bg-risk-elevated"
                    : "bg-sage"
                  : "bg-surface-elevated"
              }`}
            />
          );
        })}
      </div>

      {showDetails && (
        <div className="flex justify-between items-center text-[10px] text-text-muted pt-1 border-t border-surface-border">
          <span>0 (SAFE)</span>
          <span>THRESHOLD: 70</span>
          <span>100 (CRITICAL)</span>
        </div>
      )}
    </div>
  );
}

