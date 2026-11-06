import React from "react";
import { HindsightMemory } from "@/types";
import {
  BrainCircuit,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ExternalLink,
  GitCommit,
  UserCheck,
  Clock,
  Sparkles,
} from "lucide-react";

interface HindsightMemoryCardProps {
  memory: HindsightMemory;
  compact?: boolean;
}

export function HindsightMemoryCard({ memory, compact = false }: HindsightMemoryCardProps) {
  const isSev1 = memory.severity === "SEV-1";

  return (
    <div className="bg-surface border border-surface-border rounded overflow-hidden font-sans hover:border-signal/40 transition-colors shadow-panel">
      {/* Top Banner */}
      <div className="p-4 bg-surface-elevated/60 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
            <BrainCircuit className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-xs font-semibold text-text-primary">
            {memory.id}
          </span>
          <span className="text-text-muted font-mono text-xs">•</span>
          <span className="font-mono text-xs text-text-secondary">
            {memory.provenance.incidentTicket}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {memory.similarityScore !== undefined && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-signal/15 text-signal border border-signal/30">
              <Sparkles className="w-3 h-3 text-signal" />
              <span>{(memory.similarityScore * 100).toFixed(1)}% RECALL</span>
            </span>
          )}

          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
              isSev1
                ? "bg-risk-critical/15 text-risk-critical border-risk-critical/40"
                : "bg-risk-warning/15 text-risk-warning border-risk-warning/40"
            }`}
          >
            {memory.severity}
          </span>

          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted border border-surface-border">
            {memory.source === "HINDSIGHT_API"
              ? "API_SYNC"
              : memory.source === "LOCAL_ENGINE"
              ? "LOCAL_ENGINE"
              : "FIXTURE"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary leading-snug">
            {memory.title}
          </h4>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-text-muted mt-1">
            <span>Service: {memory.service}</span>
            <span>•</span>
            <span>Env: {memory.environment}</span>
            <span>•</span>
            <span>{new Date(memory.incidentDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Relevance Why (if triggered by dynamic recall) */}
        {memory.relevanceWhy && (
          <div className="bg-signal/10 border border-signal/25 p-2.5 rounded text-xs text-signal font-mono">
            <span className="font-semibold text-signal">Recall Logic: </span>
            <span className="text-text-primary">{memory.relevanceWhy}</span>
          </div>
        )}

        {/* Symptoms Observed */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-text-muted" />
            <span>Symptoms & Telemetry Degradation</span>
          </span>
          <ul className="space-y-1 text-xs text-text-secondary font-mono bg-surface-elevated p-2.5 rounded border border-surface-border">
            {memory.symptoms.map((symptom, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-risk-critical select-none">▸</span>
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Root Cause */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Root Cause Analysis
          </span>
          <p className="text-xs text-text-primary leading-relaxed bg-surface-elevated p-2.5 rounded border border-surface-border">
            {memory.rootCause}
          </p>
        </div>

        {!compact && (
          <>
            {/* Failed Approaches (What engineers tried that failed during outage) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-risk-warning flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-risk-warning" />
                <span>Failed Approaches During Incident (DO NOT REPEAT)</span>
              </span>
              <ul className="space-y-1 text-xs text-text-secondary bg-risk-warning/10 border border-risk-warning/30 p-2.5 rounded">
                {memory.failedApproaches.map((approach, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-risk-warning font-mono font-bold select-none">✕</span>
                    <span className="text-text-primary">{approach}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Permanent Resolution */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sage flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                <span>Verified Permanent Resolution</span>
              </span>
              <div className="text-xs text-text-primary bg-sage/10 border border-sage/30 p-2.5 rounded leading-relaxed">
                {memory.resolution}
              </div>
            </div>
          </>
        )}

        {/* Provenance Footer */}
        <div className="pt-3 border-t border-surface-border text-[11px] font-mono text-text-muted grid grid-cols-1 md:grid-cols-2 gap-2 bg-surface-elevated/40 p-2.5 rounded">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">Incident Commit:</span>
            <span className="text-text-primary">{memory.provenance.gitCommit}</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">Signoff:</span>
            <span className="text-text-primary truncate">{memory.provenance.signoffEngineer}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">Outage Duration:</span>
            <span className="text-text-primary font-bold">{memory.provenance.outageMinutes} minutes</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-text-muted">Runbook:</span>
            <a
              href={memory.provenance.runbookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-signal hover:underline inline-flex items-center gap-1 truncate"
            >
              <span>View Runbook</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

