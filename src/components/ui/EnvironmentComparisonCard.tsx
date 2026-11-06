import React from "react";
import { EnvironmentComparison, EnvironmentMismatch } from "@/types";
import { Server, ArrowRight, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface EnvironmentComparisonCardProps {
  comparison: EnvironmentComparison;
}

export function EnvironmentComparisonCard({ comparison }: EnvironmentComparisonCardProps) {
  const { originalEnv, targetEnv, mismatches, driftScore } = comparison;

  return (
    <div className="bg-surface border border-surface-border rounded-lg overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 border-b border-surface-border bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <Server className="w-4 h-4 text-brand-hindsight" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Environment Parity & Drift Analysis
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-zinc-400">Drift Score:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded border ${
              driftScore > 50
                ? "bg-red-950/60 text-red-400 border-red-700/60"
                : driftScore > 20
                ? "bg-amber-950/50 text-amber-400 border-amber-700/50"
                : "bg-emerald-950/50 text-emerald-400 border-emerald-700/50"
            }`}
          >
            {driftScore}% DRIFT
          </span>
        </div>
      </div>

      {/* Side-by-side Specification Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-surface-border text-xs">
        {/* Original Environment (e.g. Staging / Test) */}
        <div className="p-4 space-y-3 bg-surface/40">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-2">
            <span className="font-mono text-zinc-400 uppercase text-[11px]">
              Origin: {originalEnv.name}
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">VERIFIED IN QA</span>
          </div>

          <div className="space-y-1.5 font-mono text-zinc-300">
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Region:</span>
              <span>{originalEnv.region}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Replicas:</span>
              <span>{originalEnv.replicaCount} pods</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Database Engine:</span>
              <span className="text-right truncate max-w-[220px]" title={originalEnv.dbEngineVersion}>
                {originalEnv.dbEngine} {originalEnv.dbEngineVersion}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Max DB Connections:</span>
              <span>{originalEnv.maxConnections}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">TLS Negotiation:</span>
              <span>{originalEnv.tlsVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Cache Layer:</span>
              <span className="text-right truncate max-w-[220px]">{originalEnv.cacheTier}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Ingress:</span>
              <span>{originalEnv.ingressController}</span>
            </div>
          </div>
        </div>

        {/* Target Environment (e.g. Production) */}
        <div className="p-4 space-y-3 bg-surface-subtle/20">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-2">
            <span className="font-mono text-zinc-300 uppercase text-[11px] font-semibold flex items-center gap-1.5">
              <span>Target: {targetEnv.name}</span>
            </span>
            <span className="text-amber-400 font-mono text-[10px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
              PRODUCTION TARGET
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-zinc-300">
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Region:</span>
              <span>{targetEnv.region}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Replicas:</span>
              <span className="text-amber-400 font-semibold">{targetEnv.replicaCount} pods</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Database Engine:</span>
              <span className="text-right truncate max-w-[220px] text-zinc-200" title={targetEnv.dbEngineVersion}>
                {targetEnv.dbEngine} {targetEnv.dbEngineVersion}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Max DB Connections:</span>
              <span>{targetEnv.maxConnections}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">TLS Negotiation:</span>
              <span className="text-amber-400">{targetEnv.tlsVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-border/30">
              <span className="text-zinc-500">Cache Layer:</span>
              <span className="text-right truncate max-w-[220px] text-zinc-200">{targetEnv.cacheTier}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Ingress:</span>
              <span>{targetEnv.ingressController}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Mismatches List */}
      <div className="p-4 border-t border-surface-border bg-surface-subtle/10">
        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <span>Identified Environmental Discrepancies ({mismatches.length})</span>
        </h4>

        {mismatches.length === 0 ? (
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded text-xs text-emerald-400 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Parity Verified: Zero configuration or scale drift detected between origin and target cluster.</span>
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
                      ? "bg-red-950/20 border-red-800/40"
                      : mismatch.severity === "WARNING"
                      ? "bg-amber-950/20 border-amber-800/40"
                      : "bg-surface-subtle border-surface-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 flex items-center gap-2">
                      {isCrit ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>{mismatch.field}</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isCrit
                          ? "bg-red-900/50 text-red-300 border-red-700"
                          : "bg-amber-900/40 text-amber-300 border-amber-700"
                      }`}
                    >
                      {mismatch.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 bg-surface/50 p-2 rounded">
                    <div>
                      <span className="text-zinc-500">Origin: </span>
                      <span className="text-zinc-300">{mismatch.originalValue}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Target: </span>
                      <span className="text-zinc-200 font-semibold">{mismatch.targetValue}</span>
                    </div>
                  </div>

                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    <strong className="text-zinc-400 font-mono">Blast Impact: </strong>
                    {mismatch.driftImpact}
                  </p>

                  <div className="text-[11px] text-zinc-300 bg-surface/80 p-2 rounded border border-surface-border/60">
                    <span className="font-mono text-brand-hindsight font-semibold">Recommended Remediation: </span>
                    <span>{mismatch.remediationRecommendation}</span>
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
