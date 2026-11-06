import React from "react";
import { EnvironmentComparison } from "@/types";
import { Server, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface EnvironmentComparisonCardProps {
  comparison: EnvironmentComparison;
}

export function EnvironmentComparisonCard({ comparison }: EnvironmentComparisonCardProps) {
  const { originalEnv, targetEnv, mismatches, driftScore } = comparison;

  return (
    <div className="bg-surface border border-surface-border rounded overflow-hidden font-sans shadow-panel">
      {/* Header */}
      <div className="p-4 border-b border-surface-border bg-surface-elevated/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <Server className="w-4 h-4 text-signal" />
          <h3 className="text-sm font-semibold text-text-primary">
            Environment Parity & Drift Analysis
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-text-muted">Drift Score:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded border ${
              driftScore > 50
                ? "bg-risk-critical/15 text-risk-critical border-risk-critical/40"
                : driftScore > 20
                ? "bg-risk-warning/15 text-risk-warning border-risk-warning/40"
                : "bg-sage/15 text-sage border-sage/40"
            }`}
          >
            {driftScore}% DRIFT
          </span>
        </div>
      </div>

      {/* Side-by-side Specification Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-surface-border text-xs">
        {/* Original Environment (e.g. Staging / Test) */}
        <div className="p-4 space-y-3 bg-surface">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <span className="font-mono text-text-muted uppercase text-[10px]">
              Origin: {originalEnv.name}
            </span>
            <span className="text-text-muted font-mono text-[10px]">VERIFIED IN QA</span>
          </div>

          <div className="space-y-1.5 font-mono text-text-secondary text-[11px]">
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Region:</span>
              <span className="text-text-primary">{originalEnv.region}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Compute:</span>
              <span className="text-text-primary">{originalEnv.replicaCount} workers</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Database Engine:</span>
              <span className="text-right truncate max-w-[220px] text-text-primary" title={originalEnv.dbEngineVersion}>
                {originalEnv.dbEngine} {originalEnv.dbEngineVersion}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Max DB Connections:</span>
              <span className="text-text-primary">{originalEnv.maxConnections}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">TLS Negotiation:</span>
              <span className="text-text-primary">{originalEnv.tlsVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Cache Layer:</span>
              <span className="text-right truncate max-w-[220px] text-text-primary">{originalEnv.cacheTier}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Ingress / CDN:</span>
              <span className="text-text-primary">{originalEnv.ingressController}</span>
            </div>
          </div>
        </div>

        {/* Target Environment (e.g. Production) */}
        <div className="p-4 space-y-3 bg-surface-elevated/20">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <span className="font-mono text-text-primary uppercase text-[10px] font-semibold flex items-center gap-1.5">
              <span>Target: {targetEnv.name}</span>
            </span>
            <span className="text-signal font-mono text-[10px] bg-signal/15 px-1.5 py-0.5 rounded border border-signal/30">
              PRODUCTION TARGET
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-text-secondary text-[11px]">
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Region:</span>
              <span className="text-text-primary">{targetEnv.region}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Compute:</span>
              <span className="text-signal font-semibold">{targetEnv.replicaCount} workers</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Database Engine:</span>
              <span className="text-right truncate max-w-[220px] text-text-primary" title={targetEnv.dbEngineVersion}>
                {targetEnv.dbEngine} {targetEnv.dbEngineVersion}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Max DB Connections:</span>
              <span className="text-text-primary">{targetEnv.maxConnections}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">TLS Negotiation:</span>
              <span className="text-risk-warning">{targetEnv.tlsVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/40">
              <span className="text-text-muted">Cache Layer:</span>
              <span className="text-right truncate max-w-[220px] text-text-primary">{targetEnv.cacheTier}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Ingress / CDN:</span>
              <span className="text-text-primary">{targetEnv.ingressController}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Mismatches List */}
      <div className="p-4 border-t border-surface-border bg-surface-elevated/10">
        <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
          <span>Identified Environmental Discrepancies ({mismatches.length})</span>
        </h4>

        {mismatches.length === 0 ? (
          <div className="p-3 bg-sage/15 border border-sage/40 rounded text-xs text-sage flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
            <span>Parity Verified: Zero configuration or scale drift detected between origin and target environment.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {mismatches.map((mismatch, idx) => {
              const isCrit = mismatch.severity === "CRITICAL";
              return (
                <div
                  key={idx}
                  className={`p-3 rounded border text-xs space-y-2 ${
                    isCrit
                      ? "bg-risk-critical/10 border-risk-critical/30"
                      : mismatch.severity === "WARNING"
                      ? "bg-risk-warning/10 border-risk-warning/30"
                      : "bg-surface-elevated border-surface-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary flex items-center gap-2">
                      {isCrit ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-risk-critical shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-risk-warning shrink-0" />
                      )}
                      <span>{mismatch.field}</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isCrit
                          ? "bg-risk-critical/20 text-risk-critical border-risk-critical/40"
                          : "bg-risk-warning/20 text-risk-warning border-risk-warning/40"
                      }`}
                    >
                      {mismatch.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-text-secondary bg-surface p-2 rounded border border-surface-border">
                    <div>
                      <span className="text-text-muted">Origin: </span>
                      <span className="text-text-primary">{mismatch.originalValue}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Target: </span>
                      <span className="text-text-primary font-semibold">{mismatch.targetValue}</span>
                    </div>
                  </div>

                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    <strong className="text-text-primary font-mono">Blast Impact: </strong>
                    {mismatch.driftImpact}
                  </p>

                  <div className="text-[11px] text-text-secondary bg-surface p-2 rounded border border-surface-border">
                    <span className="font-mono text-signal font-semibold">Recommended Remediation: </span>
                    <span className="text-text-primary">{mismatch.remediationRecommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

