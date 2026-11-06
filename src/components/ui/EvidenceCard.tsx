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
      <div className="bg-surface border border-surface-border rounded p-5 text-center font-mono text-xs text-text-muted shadow-panel">
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
            className="bg-surface border border-surface-border rounded p-4 space-y-3 hover:border-surface-border/80 transition-colors shadow-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <AlertOctagon
                  className={`w-4 h-4 ${
                    item.severity === "CRITICAL"
                      ? "text-risk-critical"
                      : item.severity === "HIGH"
                      ? "text-risk-warning"
                      : "text-risk-elevated"
                  }`}
                />
                <span className="font-semibold text-sm text-text-primary">
                  {item.finding}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-text-secondary">
                  {item.category}
                </span>
                <SeverityBadge severity={item.severity} />
              </div>
            </div>

            <p className="text-xs text-text-primary leading-relaxed font-mono bg-surface-elevated p-2.5 rounded border border-surface-border">
              {item.rawDetails}
            </p>

            {item.fileReference && (
              <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
                <FileCode className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-text-muted">File:</span>
                <span className="text-text-primary bg-surface-elevated px-1.5 py-0.5 rounded border border-surface-border font-mono">
                  {item.fileReference}
                </span>
              </div>
            )}

            {item.telemetryMetric && (
              <div className="bg-surface-elevated p-2.5 rounded border border-surface-border text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3.5 h-3.5 text-risk-critical" />
                  <span className="text-text-muted">{item.telemetryMetric.name}:</span>
                  <span className="text-text-muted line-through">{item.telemetryMetric.before}</span>
                  <span className="text-risk-critical font-semibold">{item.telemetryMetric.after}</span>
                </div>
                <span className="text-[10px] font-bold text-risk-critical px-1.5 py-0.2 bg-risk-critical/15 rounded border border-risk-critical/40">
                  {item.telemetryMetric.deviation}
                </span>
              </div>
            )}

            <div className="text-[11px] text-text-muted pt-1 border-t border-surface-border flex items-center justify-between">
              <span>Impact: {item.impactEstimate}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

