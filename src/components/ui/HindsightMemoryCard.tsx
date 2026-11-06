import React from "react";
import { HindsightMemory } from "@/types";
import {
  BrainCircuit,
  History,
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
    <div className="bg-surface border border-surface-border rounded-lg overflow-hidden font-sans hover:border-brand-hindsight/40 transition-colors shadow-technical-sm">
      {/* Top Banner */}
      <div className="p-4 bg-surface-subtle/50 border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded bg-brand-hindsight/20 border border-brand-hindsight/40 flex items-center justify-center text-brand-hindsight">
            <BrainCircuit className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-xs font-semibold text-zinc-100">
            {memory.id}
          </span>
          <span className="text-zinc-600 font-mono text-xs">•</span>
          <span className="font-mono text-xs text-zinc-400">
            {memory.provenance.incidentTicket}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {memory.similarityScore !== undefined && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/60 shadow-glow-hindsight">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{(memory.similarityScore * 100).toFixed(1)}% RECALL</span>
            </span>
          )}

          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
              isSev1
                ? "bg-red-950/60 text-red-400 border-red-800"
                : "bg-orange-950/50 text-orange-400 border-orange-800"
            }`}
          >
            {memory.severity}
          </span>

          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700">
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
          <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
            {memory.title}
          </h4>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-zinc-500 mt-1">
            <span>Service: {memory.service}</span>
            <span>•</span>
            <span>Env: {memory.environment}</span>
            <span>•</span>
            <span>{new Date(memory.incidentDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Relevance Why (if triggered by dynamic recall) */}
        {memory.relevanceWhy && (
          <div className="bg-purple-950/20 border border-purple-800/40 p-2.5 rounded text-xs text-purple-200 font-mono">
            <span className="font-semibold text-purple-400">Recall Logic: </span>
            <span>{memory.relevanceWhy}</span>
          </div>
        )}

        {/* Symptoms Observed */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Symptoms & Telemetry Degradation</span>
          </span>
          <ul className="space-y-1 text-xs text-zinc-300 font-mono bg-surface-subtle/80 p-2.5 rounded border border-surface-border">
            {memory.symptoms.map((symptom, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-red-400 select-none">▸</span>
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Root Cause */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Root Cause Analysis
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed bg-surface-subtle p-2.5 rounded border border-surface-border/60">
            {memory.rootCause}
          </p>
        </div>

        {!compact && (
          <>
            {/* Failed Approaches (What engineers tried that failed during outage) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500/80 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Failed Approaches During Incident (DO NOT REPEAT)</span>
              </span>
              <ul className="space-y-1 text-xs text-zinc-300 bg-amber-950/10 border border-amber-800/30 p-2.5 rounded">
                {memory.failedApproaches.map((approach, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-mono font-bold select-none">✕</span>
                    <span className="text-zinc-300">{approach}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Permanent Resolution */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Permanent Resolution</span>
              </span>
              <div className="text-xs text-zinc-200 bg-emerald-950/15 border border-emerald-800/30 p-2.5 rounded leading-relaxed">
                {memory.resolution}
              </div>
            </div>
          </>
        )}

        {/* Provenance Footer */}
        <div className="pt-3 border-t border-surface-border text-[11px] font-mono text-zinc-400 grid grid-cols-1 md:grid-cols-2 gap-2 bg-surface-subtle/30 p-2.5 rounded">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Incident Commit:</span>
            <span className="text-zinc-300">{memory.provenance.gitCommit}</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Signoff:</span>
            <span className="text-zinc-300 truncate">{memory.provenance.signoffEngineer}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Outage Duration:</span>
            <span className="text-zinc-300 font-bold">{memory.provenance.outageMinutes} minutes</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">Runbook:</span>
            <a
              href={memory.provenance.runbookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-hindsight hover:underline inline-flex items-center gap-1 truncate"
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
