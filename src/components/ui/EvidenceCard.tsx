import React from "react";
import { DeploymentEvidence } from "@/types";
import { SeverityBadge } from "./StatusBadge";
import { FileCode, AlertOctagon, TrendingUp } from "lucide-react";

interface EvidenceCardProps {
  evidence: DeploymentEvidence[];
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  if (evidence.length === 0) {
    return (
      <div className="bg-surface border border-surface-border rounded-lg p-5 text-center font-mono text-xs text-zinc-400">
        No anomalous telemetry or hazardous deployment evidence detected.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {evidence.map((item) => {
        return (
          <div
            key={item.id}
            className="bg-surface border border-surface-border rounded-lg p-4 space-y-3 hover:border-zinc-700 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <AlertOctagon
                  className={`w-4 h-4 ${
                    item.severity === "CRITICAL"
                      ? "text-red-400"
                      : item.severity === "HIGH"
                      ? "text-orange-400"
                      : "text-amber-400"
                  }`}
                />
                <span className="font-semibold text-sm text-zinc-100">
                  {item.finding}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-surface-border text-zinc-400">
                  {item.category}
                </span>
                <SeverityBadge severity={item.severity} />
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-surface-subtle p-2.5 rounded border border-surface-border/50">
              {item.rawDetails}
            </p>

            {item.fileReference && (
              <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
                <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500">File:</span>
                <span className="text-zinc-300 bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border/40">
                  {item.fileReference}
                </span>
              </div>
            )}

            {item.telemetryMetric && (
              <div className="bg-surface-subtle/80 p-2.5 rounded border border-surface-border text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-zinc-400">{item.telemetryMetric.name}:</span>
                  <span className="text-zinc-500 line-through">{item.telemetryMetric.before}</span>
                  <span className="text-red-400 font-semibold">{item.telemetryMetric.after}</span>
                </div>
                <span className="text-[11px] font-bold text-red-400 px-1.5 py-0.2 bg-red-950/60 rounded border border-red-800">
                  {item.telemetryMetric.deviation}
                </span>
              </div>
            )}

            <div className="text-[11px] text-zinc-400 pt-1 border-t border-surface-border/40 flex items-center justify-between">
              <span>Impact: {item.impactEstimate}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
